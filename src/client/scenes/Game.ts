import { Scene } from 'phaser';
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
  
  // Sprites
  gridContainer: Phaser.GameObjects.Container;
  redKnight: Phaser.GameObjects.Sprite;
  blueKnight: Phaser.GameObjects.Sprite;
  redDestination: Phaser.GameObjects.Image;
  blueDestination: Phaser.GameObjects.Image;
  
  // UI
  uiContainer: Phaser.GameObjects.Container;
  gameOver = false;
  selectedKnight: 'red' | 'blue' = 'red';
  selectBtnText: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
  }

  init() {
    this.gameOver = false;
    this.selectedKnight = 'red';
    this.obstacles = [];
    this.enemies = [];
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x47aba9);

    this.gridContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);

    this.createGrid();
    this.createKnights();
    this.createControls();

    this.updateLayout(this.scale.width, this.scale.height);
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.updateLayout(gameSize.width, gameSize.height);
    });
    
    // Keyboard controls for testing on desktop
    this.input.keyboard?.on('keydown-UP', () => this.move(0, -1));
    this.input.keyboard?.on('keydown-DOWN', () => this.move(0, 1));
    this.input.keyboard?.on('keydown-LEFT', () => this.move(-1, 0));
    this.input.keyboard?.on('keydown-RIGHT', () => this.move(1, 0));
  }

  createGrid() {
    const map = this.make.tilemap({ key: 'baselevelnine' });
    
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
      const img = this.add.image(
        obs.x * this.cellSize + this.cellSize / 2, 
        obs.y * this.cellSize + this.cellSize / 2 - 8,
        obs.type
      );
      const scale = (this.cellSize * 0.9) / img.width;
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
    const createBtn = (x: number, y: number, label: string, dx: number, dy: number) => {
      const btn = this.add.text(x, y, label, {
        fontSize: '36px',
        backgroundColor: '#444',
        padding: { x: 8, y: 8 }
      }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.move(dx, dy));
      this.uiContainer.add(btn);
    };

    // Arrange buttons in a single horizontal line at the bottom
    createBtn(-150, 0, '⬅️', -1, 0);
    createBtn(-75, 0, '⬇️', 0, 1);
    
    // Toggle button in the center
    this.selectBtnText = this.add.text(0, 0, '🔴', {
      fontSize: '36px',
      backgroundColor: '#444',
      padding: { x: 8, y: 8 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.selectedKnight = this.selectedKnight === 'red' ? 'blue' : 'red';
        this.selectBtnText.setText(this.selectedKnight === 'red' ? '🔴' : '🔵');
      });
    this.uiContainer.add(this.selectBtnText);

    createBtn(75, 0, '⬆️', 0, -1);
    createBtn(150, 0, '➡️', 1, 0);
  }

  updateLayout(width: number, height: number) {
    this.cameras.resize(width, height);

    // Center grid
    const totalGridWidth = 6 * this.cellSize;
    const totalGridHeight = 8 * this.cellSize;
    
    // Calculate base scale to fit screen, then multiply by 1.2x as requested
    let scaleFactor = Math.min(width / (totalGridWidth + 40), height / (totalGridHeight + 200), 1);
    scaleFactor *= 1.1;
    
    this.gridContainer.setScale(scaleFactor);
    
    const scaledGridW = totalGridWidth * scaleFactor;
    const scaledGridH = totalGridHeight * scaleFactor;
    
    this.gridContainer.setPosition(
      (width - scaledGridW) / 2,
      (height - scaledGridH) / 2 - 50 * scaleFactor // Shift up slightly for controls
    );

    // Center UI (controls) near the bottom edge
    this.uiContainer.setPosition(width / 2, height - 60);
    this.uiContainer.setScale(scaleFactor);
  }

  move(dx: number, dy: number) {
    if (this.gameOver) return;

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
      this.showPopup("Level Complete!");
      this.gameOver = true;
    }
  }

  showPopup(msg: string) {
    // A simple text popup
    const popup = this.add.container(this.scale.width / 2, this.scale.height / 2);
    
    const bg = this.add.rectangle(0, 0, 400, 200, 0x000000, 0.8);
    bg.setStrokeStyle(4, 0xffffff);
    
    const text = this.add.text(0, 0, msg, {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Add a retry button
    const retryBtn = this.add.text(0, 60, 'Retry', {
      fontSize: '24px',
      backgroundColor: '#555',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.restart();
      });

    popup.add([bg, text, retryBtn]);
    
    // Scale popup with game size
    const scaleFactor = Math.min(this.scale.width / 1024, this.scale.height / 768, 1);
    popup.setScale(scaleFactor);
  }
}
