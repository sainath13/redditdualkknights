import { Scene } from 'phaser';
import { InitResponse, LeaderboardEntry } from '../../shared/api';
import * as Phaser from 'phaser';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  
  // Grid config
  gridWidth = 6;
  gridHeight = 8;
  cellSize = 64;
  
  // Game State
  redPos = { x: 1, y: 1 };
  bluePos = { x: 4, y: 3 };
  redFinalPos = { x: 1, y: 0 };
  blueFinalPos = { x: 4, y: 4 };
  
  obstacles: { type: string, x: number, y: number }[] = [];
  enemies: { type: string, x: number, y: number }[] = [];
  
  stepCount = 0;
  stepText!: Phaser.GameObjects.Text;
  
  // Sprites
  gridContainer: Phaser.GameObjects.Container;
  redKnight: Phaser.GameObjects.Sprite;
  blueKnight: Phaser.GameObjects.Sprite;
  redDestination: Phaser.GameObjects.Image;
  blueDestination: Phaser.GameObjects.Image;
  
  // UI
  uiContainer: Phaser.GameObjects.Container;
  controlsContainer!: Phaser.GameObjects.Container;
  hudContainer!: Phaser.GameObjects.Container;
  gameOver = false;
  selectedKnight: 'red' | 'blue' = 'red';
  selectBtnContainer!: Phaser.GameObjects.Container;
  selectKnightSprite!: Phaser.GameObjects.Sprite;
  
  // Zoom & Pan state
  defaultScale = 1;
  defaultPos = { x: 0, y: 0 };
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  gridStartX = 0;
  gridStartY = 0;
  initialPinchDistance = 0;
  initialPinchScale = 1;

  constructor() {
    super('Game');
  }

  init() {
    this.gameOver = false;
    this.selectedKnight = 'red';
    this.obstacles = [];
    this.enemies = [];
    this.stepCount = 0;
    this.isDragging = false;
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x47aba9);

    this.gridContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);
    this.controlsContainer = this.add.container(0, 0);
    this.hudContainer = this.add.container(0, 0);

    const loadingText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Loading Map...', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Fetch custom level data from Devvit backend
    fetch('/api/init')
      .then(res => res.json())
      .then((data: InitResponse) => {
        loadingText.destroy();
        let mapKey = 'baselevelnine';

        if (data.levelData) {
          try {
            const parsedMap = JSON.parse(data.levelData);
            this.cache.tilemap.add('customLevel', { format: Phaser.Tilemaps.Formats.TILED_JSON, data: parsedMap });
            mapKey = 'customLevel';
          } catch (e) {
            console.error('Failed to parse custom level data:', e);
          }
        }
        
        // Fire and forget to record an attempt
        fetch('/api/record-attempt', { method: 'POST' }).catch(e => console.error(e));

        this.createGrid(mapKey);
        this.createKnights();
        this.createControls();

        this.updateLayout(this.scale.width, this.scale.height);
      })
      .catch(err => {
        console.error('Error fetching /api/init:', err);
        loadingText.destroy();
        this.createGrid('baselevelnine');
        this.createKnights();
        this.createControls();
        this.updateLayout(this.scale.width, this.scale.height);
      });

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.updateLayout(gameSize.width, gameSize.height);
    });
    
    // Keyboard controls for testing on desktop
    this.input.keyboard?.on('keydown-UP', () => this.move(0, -1));
    this.input.keyboard?.on('keydown-DOWN', () => this.move(0, 1));
    this.input.keyboard?.on('keydown-LEFT', () => this.move(-1, 0));
    this.input.keyboard?.on('keydown-RIGHT', () => this.move(1, 0));

    this.setupZoomAndPan();
  }

  setupZoomAndPan() {
    this.input.addPointer(1); // Ensure we have enough pointers for multi-touch

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number, _deltaZ: number) => {
      let newScale = this.gridContainer.scale - (deltaY * 0.001);
      newScale = Phaser.Math.Clamp(newScale, this.defaultScale * 0.25, this.defaultScale * 4);
      this.gridContainer.setScale(newScale);
    });

    // Pointer events for drag (pan) and pinch (zoom)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) => {
      if (gameObjects.length > 0) return; // Ignore if clicking UI

      const pointers = this.input.manager.pointers.filter(p => p.isDown);
      
      if (pointers.length === 1) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.gridStartX = this.gridContainer.x;
        this.gridStartY = this.gridContainer.y;
      } else if (pointers.length === 2) {
        this.isDragging = false;
        const p1 = pointers[0]!;
        const p2 = pointers[1]!;
        this.initialPinchDistance = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        this.initialPinchScale = this.gridContainer.scale;
      }
    });

    this.input.on('pointermove', (_pointer: Phaser.Input.Pointer) => {
      const pointers = this.input.manager.pointers.filter(p => p.isDown);
      
      if (pointers.length === 1 && this.isDragging) {
        const dx = pointers[0]!.x - this.dragStartX;
        const dy = pointers[0]!.y - this.dragStartY;
        this.gridContainer.setPosition(this.gridStartX + dx, this.gridStartY + dy);
      } else if (pointers.length === 2) {
        const p1 = pointers[0]!;
        const p2 = pointers[1]!;
        const currentDist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        const scaleDelta = currentDist / this.initialPinchDistance;
        let newScale = this.initialPinchScale * scaleDelta;
        newScale = Phaser.Math.Clamp(newScale, this.defaultScale * 0.25, this.defaultScale * 4);
        this.gridContainer.setScale(newScale);
      }
    });

    this.input.on('pointerup', () => {
      const pointers = this.input.manager.pointers.filter(p => p.isDown);
      if (pointers.length === 0) {
        this.isDragging = false;
      } else if (pointers.length === 1) {
        this.isDragging = true;
        const p = pointers[0]!;
        this.dragStartX = p.x;
        this.dragStartY = p.y;
        this.gridStartX = this.gridContainer.x;
        this.gridStartY = this.gridContainer.y;
      }
    });
  }

  resetView() {
    this.tweens.add({
      targets: this.gridContainer,
      x: this.defaultPos.x,
      y: this.defaultPos.y,
      scaleX: this.defaultScale,
      scaleY: this.defaultScale,
      duration: 300,
      ease: 'Power2'
    });
  }

  createGrid(mapKey: string) {
    const map = this.make.tilemap({ key: mapKey });
    
    // Link the tileset names from Tiled to the image keys in Phaser
    const waterTileset = map.addTilesetImage('Water Background color', 'water_tiles');
    const landscapeTileset = map.addTilesetImage('Tilemap_color1', 'landscape_tiles');
    
    if (waterTileset && landscapeTileset) {
      const waterLayer = map.createLayer('water', waterTileset, 0, 0);
      const groundLayer = map.createLayer('ground', landscapeTileset, 0, 0);
      
      if (waterLayer) this.gridContainer.add(waterLayer);
      if (groundLayer) this.gridContainer.add(groundLayer);
    }
    
    const spawnLayer = map.getObjectLayer('spawn_points');
    if (spawnLayer && spawnLayer.objects) {
      spawnLayer.objects.forEach(obj => {
        const gx = Math.floor((obj.x || 0) / this.cellSize);
        const gy = Math.floor((obj.y || 0) / this.cellSize);
        if (obj.name === 'red_start') this.redPos = { x: gx, y: gy };
        if (obj.name === 'blue_start') this.bluePos = { x: gx, y: gy };
        if (obj.name === 'red_dest') this.redFinalPos = { x: gx, y: gy };
        if (obj.name === 'blue_dest') this.blueFinalPos = { x: gx, y: gy };
      });
    }

    const cliffGroundsLayer = map.getObjectLayer('cliff_grounds');
    if (cliffGroundsLayer && cliffGroundsLayer.objects) {
      cliffGroundsLayer.objects.forEach(obj => {
        const gx = Math.floor((obj.x || 0) / this.cellSize);
        const gy = Math.floor((obj.y || 0) / this.cellSize);
        const img = this.add.image(
          gx * this.cellSize + this.cellSize / 2, 
          gy * this.cellSize + this.cellSize / 2,
          obj.name
        );
        // Overlap slightly by 1 pixel to prevent subpixel rendering gaps
        const scale = (this.cellSize + 1.0) / img.width;
        img.setScale(scale);
        this.gridContainer.add(img);
      });
    }

    const obsLayer = map.getObjectLayer('obstacles');
    if (obsLayer && obsLayer.objects) {
      obsLayer.objects.forEach(obj => {
        const gx = Math.floor((obj.x || 0) / this.cellSize);
        const gy = Math.floor((obj.y || 0) / this.cellSize);
        this.obstacles.push({ type: obj.name, x: gx, y: gy });
      });
    }

    // Render obstacles
    this.obstacles.forEach(obs => {
      const isFence = obs.type.startsWith('fence_') || obs.type.startsWith('cliff_');
      const offsetY = isFence ? 0 : -8;
      
      const img = this.add.image(
        obs.x * this.cellSize + this.cellSize / 2, 
        obs.y * this.cellSize + this.cellSize / 2 + offsetY,
        obs.type
      );
      
      const scaleRatio = isFence ? 1.0 : 0.9;
      const scale = (this.cellSize * scaleRatio) / img.width;
      img.setScale(scale);
      this.gridContainer.add(img);
    });

    const enemiesLayer = map.getObjectLayer('enemies');
    if (enemiesLayer && enemiesLayer.objects) {
      enemiesLayer.objects.forEach(obj => {
        const gx = Math.floor((obj.x || 0) / this.cellSize);
        const gy = Math.floor((obj.y || 0) / this.cellSize);
        this.enemies.push({ type: obj.name, x: gx, y: gy });
      });
    }

    // Render enemies
    this.enemies.forEach(enemy => {
      const img = this.add.image(
        enemy.x * this.cellSize + this.cellSize / 2, 
        enemy.y * this.cellSize + this.cellSize / 2 - 8,
        enemy.type
      );
      const scale = (this.cellSize * 0.9) / img.width;
      img.setScale(scale);
      this.gridContainer.add(img);
    });

    // Destinations (no offset needed for baselevelfive)
    this.redDestination = this.add.image(
      (this.redFinalPos.x) * this.cellSize + this.cellSize / 2,
      (this.redFinalPos.y) * this.cellSize + this.cellSize / 2,
      'btn_red'
    );
    this.redDestination.setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8);
    this.gridContainer.add(this.redDestination);

    this.blueDestination = this.add.image(
      (this.blueFinalPos.x) * this.cellSize + this.cellSize / 2,
      (this.blueFinalPos.y) * this.cellSize + this.cellSize / 2,
      'btn_blue'
    );
    this.blueDestination.setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8);
    this.gridContainer.add(this.blueDestination);
  }

  createKnights() {
    this.anims.create({
      key: 'red_idle',
      frames: this.anims.generateFrameNumbers('redknight', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'blue_idle',
      frames: this.anims.generateFrameNumbers('blueknight', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });

    this.redKnight = this.add.sprite(0, 0, 'redknight');
    this.blueKnight = this.add.sprite(0, 0, 'blueknight');

    // The knight's actual occupied space is 94x94 (from 48px to 142px) in the 192x192 frame.
    // We want the 94x94 area to take up about 80% of our 64px cell size.
    const scale = (this.cellSize * 0.9) / 94; 
    this.redKnight.setScale(scale);
    this.blueKnight.setScale(scale);
    this.blueKnight.setFlipX(true);
    
    this.redKnight.play('red_idle');
    this.blueKnight.play('blue_idle');

    this.gridContainer.add(this.redKnight);
    this.gridContainer.add(this.blueKnight);
    
    this.updateKnightPositions(false);
  }

  createControls() {
    const createBtn = (x: number, y: number, textureKey: string, dx: number, dy: number) => {
      const btn = this.add.image(x, y, textureKey).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.setDisplaySize(45, 45);

      btn.on('pointerdown', () => {
        btn.setTexture(`${textureKey}_pressed`);
        this.move(dx, dy);
      });
      btn.on('pointerup', () => btn.setTexture(textureKey));
      btn.on('pointerout', () => btn.setTexture(textureKey));

      this.controlsContainer.add(btn);
    };

    // Toggle button in the center (0, 0)
    this.selectBtnContainer = this.add.container(0, 0);
    
    this.selectKnightSprite = this.add.sprite(0, -5, 'redknight'); // -5 to center visually
    this.selectKnightSprite.play('red_idle');
    const scale = 45 / 94; // scale to fit roughly the new 45x45 size
    this.selectKnightSprite.setScale(scale);
    
    this.selectBtnContainer.add([this.selectKnightSprite]);
    
    this.selectKnightSprite.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.selectedKnight = this.selectedKnight === 'red' ? 'blue' : 'red';
        this.selectKnightSprite.setTexture(`${this.selectedKnight}knight`);
        this.selectKnightSprite.play(`${this.selectedKnight}_idle`);
        if (this.selectedKnight === 'blue') {
          this.selectKnightSprite.setFlipX(true);
        } else {
          this.selectKnightSprite.setFlipX(false);
        }
      });
      
    this.controlsContainer.add(this.selectBtnContainer);

    // Arrange buttons in a circle around the center (0,0)
    // Distance from center = 45px
    createBtn(-45, 0, 'arrow_left', -1, 0);
    createBtn(45, 0, 'arrow_right', 1, 0);
    createBtn(0, -45, 'arrow_up', 0, -1);
    createBtn(0, 45, 'arrow_down', 0, 1);
    
    // HUD Buttons on the right side of screen (hudContainer)
    // 2x2 Grid Layout
    const btnScale = 45;
    const offset = 30;

    // Relocate Button (Top Left)
    const resetBtn = this.add.image(-offset, -offset, 'center_btn').setOrigin(0.5).setInteractive({ useHandCursor: true });
    resetBtn.setDisplaySize(btnScale, btnScale);
    resetBtn.on('pointerdown', () => {
      resetBtn.setTexture('center_btn_pressed');
      this.resetView();
    });
    resetBtn.on('pointerup', () => resetBtn.setTexture('center_btn'));
    resetBtn.on('pointerout', () => resetBtn.setTexture('center_btn'));

    // Step Count (Top Right)
    const stepsBg = this.add.image(offset, -offset, 'btn_steps').setOrigin(0.5);
    stepsBg.setDisplaySize(btnScale, btnScale);
    this.stepText = this.add.text(offset, -offset, '0', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Replay Button (Bottom Left)
    const replayBtn = this.add.image(-offset, offset, 'btn_replay').setOrigin(0.5).setInteractive({ useHandCursor: true });
    replayBtn.setDisplaySize(btnScale, btnScale);
    replayBtn.on('pointerdown', () => {
      replayBtn.setTexture('btn_replay_pressed');
      this.scene.restart();
    });
    replayBtn.on('pointerup', () => replayBtn.setTexture('btn_replay'));
    replayBtn.on('pointerout', () => replayBtn.setTexture('btn_replay'));

    // Menu / Close Button (Bottom Right)
    const closeBtn = this.add.image(offset, offset, 'btn_close').setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.setDisplaySize(btnScale, btnScale);
    closeBtn.on('pointerdown', () => {
      closeBtn.setTexture('btn_close_pressed');
      this.scene.start('MainMenu');
    });
    closeBtn.on('pointerup', () => closeBtn.setTexture('btn_close'));
    closeBtn.on('pointerout', () => closeBtn.setTexture('btn_close'));

    this.hudContainer.add([replayBtn, resetBtn, stepsBg, this.stepText, closeBtn]);
  }

  updateLayout(width: number, height: number) {
    this.cameras.resize(width, height);

    // Center grid
    const totalGridWidth = 6 * this.cellSize;
    const totalGridHeight = 8 * this.cellSize;
    
    // Calculate base scale to fit screen, then multiply by 1.1x as requested
    let scaleFactor = Math.min(width / (totalGridWidth + 40), height / (totalGridHeight + 200), 1);
    scaleFactor *= 1.1;
    
    this.defaultScale = scaleFactor;
    this.defaultPos = {
      x: (width - totalGridWidth * scaleFactor) / 2,
      y: (height - totalGridHeight * scaleFactor) / 2 - 50 * scaleFactor // Shift up slightly for controls
    };
    
    // Only update position/scale if not already dragging/zooming, or if this is the first layout pass
    if (!this.isDragging) {
      this.gridContainer.setScale(this.defaultScale);
      this.gridContainer.setPosition(this.defaultPos.x, this.defaultPos.y);
    }

    // Position HUD (Menu/Steps) at top-left
    this.uiContainer.setPosition(0, 0);
    this.uiContainer.setScale(scaleFactor);
    
    // Position Controls (D-pad) at bottom-left
    this.controlsContainer.setPosition(85 * scaleFactor, height - 100 * scaleFactor);
    this.controlsContainer.setScale(scaleFactor);
    
    // Position HUD (Replay, Steps, Menu) at bottom-right
    this.hudContainer.setPosition(width - 85 * scaleFactor, height - 100 * scaleFactor);
    this.hudContainer.setScale(scaleFactor);
  }

  move(dx: number, dy: number) {
    if (this.gameOver) return;

    // Increment step count on any move attempt
    this.stepCount++;
    this.stepText.setText(`${this.stepCount}`);

    // If blue is selected, invert the movement inputs so the arrows control Blue directly.
    if (this.selectedKnight === 'blue') {
      dx = -dx;
      dy = -dy;
    }

    const isBlocked = (x: number, y: number) => {
      if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return true;
      if (this.obstacles.some(o => o.x === x && o.y === y)) return true;
      return false;
    };

    const oldRedX = this.redPos.x;
    const oldRedY = this.redPos.y;
    const oldBlueX = this.bluePos.x;
    const oldBlueY = this.bluePos.y;

    let redMoved = false;
    const newRedX = this.redPos.x + dx;
    const newRedY = this.redPos.y + dy;
    
    if (!isBlocked(newRedX, newRedY)) {
      this.redPos.x = newRedX;
      this.redPos.y = newRedY;
      redMoved = true;
    }

    let blueMoved = false;
    const newBlueX = this.bluePos.x - dx; // opposite direction
    const newBlueY = this.bluePos.y - dy; // opposite direction
    
    if (!isBlocked(newBlueX, newBlueY)) {
      this.bluePos.x = newBlueX;
      this.bluePos.y = newBlueY;
      blueMoved = true;
    }

    if (redMoved || blueMoved) {
      const swapped = 
        this.redPos.x === oldBlueX && this.redPos.y === oldBlueY &&
        this.bluePos.x === oldRedX && this.bluePos.y === oldRedY;

      if (swapped) {
        this.updateKnightPositions(true);
        this.showPopup("Game Over!\nKnights crossed paths.");
        this.gameOver = true;
        return;
      }

      this.updateKnightPositions(true);
      this.checkWinCondition();
    }
  }

  updateKnightPositions(animate = false) {
    // Update destination button states
    const redOnDest = this.redPos.x === this.redFinalPos.x && this.redPos.y === this.redFinalPos.y;
    this.redDestination.setTexture(redOnDest ? 'btn_red_pressed' : 'btn_red');

    const blueOnDest = this.bluePos.x === this.blueFinalPos.x && this.bluePos.y === this.blueFinalPos.y;
    this.blueDestination.setTexture(blueOnDest ? 'btn_blue_pressed' : 'btn_blue');

    const rx = (this.redPos.x) * this.cellSize + this.cellSize / 2;
    const ry = (this.redPos.y) * this.cellSize + this.cellSize / 2 - 8;
    
    const bx = (this.bluePos.x) * this.cellSize + this.cellSize / 2;
    const by = (this.bluePos.y) * this.cellSize + this.cellSize / 2 - 8;

    if (animate) {
      this.tweens.add({
        targets: this.redKnight,
        x: rx, y: ry,
        duration: 150,
        ease: 'Power2'
      });
      this.tweens.add({
        targets: this.blueKnight,
        x: bx, y: by,
        duration: 150,
        ease: 'Power2'
      });
    } else {
      this.redKnight.setPosition(rx, ry);
      this.blueKnight.setPosition(bx, by);
    }
  }

  checkWinCondition() {
    if (this.redPos.x === this.bluePos.x && this.redPos.y === this.bluePos.y) {
      this.showPopup("Game Over!\nKnights collided.");
      this.gameOver = true;
      return;
    }

    if (this.enemies.some(e => e.x === this.redPos.x && e.y === this.redPos.y) || 
        this.enemies.some(e => e.x === this.bluePos.x && e.y === this.bluePos.y)) {
      this.showPopup("Game Over!\nYou hit a barrel!");
      this.gameOver = true;
      return;
    }

    if (this.redPos.x === this.redFinalPos.x && this.redPos.y === this.redFinalPos.y &&
        this.bluePos.x === this.blueFinalPos.x && this.bluePos.y === this.blueFinalPos.y) {
      this.gameOver = true;
      void this.showLeaderboardPopup();
    }
  }

  async showLeaderboardPopup() {
    const popup = this.add.container(this.scale.width / 2, this.scale.height / 2);
    
    const bg = this.add.image(0, 0, 'popup_bg');
    bg.setDisplaySize(500, 400);
    
    const title = this.add.text(0, -160, 'Level Complete!', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffcc00',
      align: 'center',
      wordWrap: { width: 436, useAdvancedWrap: true }
    }).setOrigin(0.5);

    const scoreText = this.add.text(0, -110, `You finished in ${this.stepCount} steps!`, {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 436, useAdvancedWrap: true }
    }).setOrigin(0.5);

    const loadingText = this.add.text(0, -20, 'Submitting score...', {
      fontSize: '20px', color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: 436, useAdvancedWrap: true }
    }).setOrigin(0.5);

    popup.add([bg, title, scoreText, loadingText]);

    let scaleFactor = Math.min(this.scale.width / 1024, this.scale.height / 768, 1.2);
    if (this.scale.width < 800) {
      scaleFactor = this.scale.width / 550; // Keeps 500px popup inside the screen width safely
    }
    popup.setScale(scaleFactor);

    try {
      // Submit score
      await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: this.stepCount })
      });

      // Fetch leaderboard
      loadingText.setText('Loading Leaderboard...');
      const lbRes = await fetch('/api/leaderboard');
      const lbData = await lbRes.json();
      
      loadingText.destroy();

      let lbString = "--- Top Players ---\n";
      if (lbData.scores && lbData.scores.length > 0) {
        lbData.scores.forEach((entry: LeaderboardEntry, index: number) => {
          lbString += `${index + 1}. ${entry.member} - ${entry.score} steps\n`;
        });
      } else {
        lbString += "No scores yet!";
      }

      const lbText = this.add.text(0, 0, lbString, {
        fontSize: '20px',
        color: '#88ff88',
        align: 'left',
        wordWrap: { width: 436, useAdvancedWrap: true }
      }).setOrigin(0.5, 0.5);

      const attempts = lbData.attempts || 0;
      const solves = lbData.solves || 0;
      const statsText = this.add.text(0, 70, `Global Stats: ${attempts} Plays | ${solves} Solves`, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffcc00',
        align: 'center',
        wordWrap: { width: 436, useAdvancedWrap: true }
      }).setOrigin(0.5, 0.5);

      popup.add([lbText, statsText]);

    } catch (e) {
      loadingText.setText('Failed to load leaderboard.');
      console.error(e);
    }

    const okBtn = this.add.container(0, 150);
    const okImg = this.add.image(0, 0, 'menu_btn').setInteractive({ useHandCursor: true });
    okImg.setDisplaySize(140, 50);
    
    const okText = this.add.text(0, -4, 'Retry', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    okImg.on('pointerdown', () => {
      okImg.setTexture('menu_btn_pressed');
      okText.setY(0);
    });
    okImg.on('pointerup', () => {
      okImg.setTexture('menu_btn');
      okText.setY(-4);
      this.scene.restart();
    });
    okImg.on('pointerout', () => {
      okImg.setTexture('menu_btn');
      okText.setY(-4);
    });

    okBtn.add([okImg, okText]);
    popup.add(okBtn);
  }



  showPopup(msg: string) {
    // A simple text popup
    const popup = this.add.container(this.scale.width / 2, this.scale.height / 2);
    
    const bg = this.add.image(0, 0, 'popup_bg');
    bg.setDisplaySize(400, 240);
    
    const text = this.add.text(0, -30, msg, {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 336, useAdvancedWrap: true }
    }).setOrigin(0.5);

    // Add a retry button
    const retryBtn = this.add.container(0, 60);
    const retryImg = this.add.image(0, 0, 'menu_btn').setInteractive({ useHandCursor: true });
    retryImg.setDisplaySize(140, 50);
    
    const retryText = this.add.text(0, -4, 'Retry', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    retryImg.on('pointerdown', () => {
      retryImg.setTexture('menu_btn_pressed');
      retryText.setY(0);
    });
    retryImg.on('pointerup', () => {
      retryImg.setTexture('menu_btn');
      retryText.setY(-4);
      this.scene.restart();
    });
    retryImg.on('pointerout', () => {
      retryImg.setTexture('menu_btn');
      retryText.setY(-4);
    });

    retryBtn.add([retryImg, retryText]);
    popup.add([bg, text, retryBtn]);
    
    // Scale popup with game size
    let scaleFactor = Math.min(this.scale.width / 1024, this.scale.height / 768, 1.5);
    if (this.scale.width < 800) {
      scaleFactor = this.scale.width / 450; // Keeps 400px popup inside the screen width safely
    }
    popup.setScale(scaleFactor);
  }
}
