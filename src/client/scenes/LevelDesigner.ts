import { Scene, GameObjects } from 'phaser';
import { navigateTo } from '@devvit/web/client';
import * as Phaser from 'phaser';

type BrushType = 'water' | 'red_start' | 'blue_start' | 'red_dest' | 'blue_dest'
  | 'tile_top_left' | 'tile_top_mid' | 'tile_top_right'
  | 'tile_mid_left' | 'tile_middle' | 'tile_mid_right'
  | 'tile_bot_left' | 'tile_bot_mid' | 'tile_bot_right'
  | 'obs_bush1' | 'obs_pumpkin1' | 'obs_pumpkin2' | 'obs_rock' | 'enemy_barrel' | 'eraser'
  | 'fence_left_bottom' | 'fence_left_connected_mid_open' | 'fence_left_middle' 
  | 'fence_right_bottom' | 'fence_right_connect_mid_open' | 'fence_right_middle'
  | 'fence_top_left' | 'fence_top_middle_one' | 'fence_top_middle_two' | 'fence_top_right';

interface Pos {
  x: number;
  y: number;
}

interface Obstacle {
  type: string;
  x: number;
  y: number;
}

export class LevelDesigner extends Scene {
  gridWidth = 6;
  gridHeight = 8;
  cellSize = 64;

  // 0 = water, 1 = grass
  mapData: number[][] = [];
  
  redStart: Pos | null = null;
  blueStart: Pos | null = null;
  redDest: Pos | null = null;
  blueDest: Pos | null = null;

  obstacles: Obstacle[] = [];
  enemies: Obstacle[] = [];

  currentBrush: BrushType = 'tile_middle';

  gridContainer!: GameObjects.Container;
  uiContainer!: GameObjects.Container;
  brushText!: GameObjects.Text;
  publishBtn!: GameObjects.Text;
  
  tileImages: GameObjects.Image[][] = [];
  obstacleImages: GameObjects.Image[] = [];
  enemyImages: GameObjects.Image[] = [];
  entitySprites: Record<string, GameObjects.Image | GameObjects.Sprite> = {};

  constructor() {
    super('LevelDesigner');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x222222);

    // Initialize blank map (all water)
    this.mapData = [];
    this.tileImages = [];
    for (let y = 0; y < this.gridHeight; y++) {
      const dataRow: number[] = [];
      const imgRow: GameObjects.Image[] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        dataRow.push(0); // default water
        imgRow.push(null as unknown as GameObjects.Image);
      }
      this.mapData.push(dataRow);
      this.tileImages.push(imgRow);
    }

    this.gridContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);

    this.createVisualGrid();
    this.createPalette();
    
    // Add Back Button
    this.add.text(20, 20, '⬅ Back', {
      fontSize: '24px',
      backgroundColor: '#444',
      padding: { x: 10, y: 10 }
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenu'));

    // Publish button
    this.publishBtn = this.add.text(this.scale.width - 20, 20, 'Publish to Reddit', {
      fontSize: '24px',
      backgroundColor: '#47aba9',
      padding: { x: 20, y: 10 }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showPublishPrompt(this.generateMapJSON()));
    
    this.updateLayout(this.scale.width, this.scale.height);
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.updateLayout(gameSize.width, gameSize.height);
    });

    // Make grid interactive
    this.input.on('pointerdown', this.handlePointer, this);
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.handlePointer(pointer);
      }
    });
  }

  createVisualGrid() {
    this.gridContainer.removeAll(true);
    this.entitySprites = {};

    // Create the background (all water)
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const bg = this.add.image(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, 'water_tiles', 0);
        this.gridContainer.add(bg);
      }
    }

    // Create the foreground (manual tiles)
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const img = this.add.image(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, 'tile_middle');
        img.setVisible(false);
        this.gridContainer.add(img);
        this.tileImages[y]![x] = img;
      }
    }

    // Create Entity Sprites
    this.entitySprites['red_dest'] = this.add.image(-1000, -1000, 'btn_red');
    this.entitySprites['red_dest'].setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8);
    this.gridContainer.add(this.entitySprites['red_dest']);

    this.entitySprites['blue_dest'] = this.add.image(-1000, -1000, 'btn_blue');
    this.entitySprites['blue_dest'].setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8);
    this.gridContainer.add(this.entitySprites['blue_dest']);

    this.entitySprites['red_start'] = this.add.sprite(-1000, -1000, 'redknight');
    this.entitySprites['red_start'].setScale((this.cellSize * 0.9) / 94);
    this.gridContainer.add(this.entitySprites['red_start']);

    this.entitySprites['blue_start'] = this.add.sprite(-1000, -1000, 'blueknight');
    this.entitySprites['blue_start'].setScale((this.cellSize * 0.9) / 94);
    (this.entitySprites['blue_start'] as GameObjects.Sprite).setFlipX(true);
    this.gridContainer.add(this.entitySprites['blue_start']);

    this.refreshGrid();
  }

  handlePointer(pointer: Phaser.Input.Pointer) {
    // Transform screen coordinates to grid coordinates
    const scale = this.gridContainer.scale;
    const localX = (pointer.x - this.gridContainer.x) / scale;
    const localY = (pointer.y - this.gridContainer.y) / scale;

    const gridX = Math.floor(localX / this.cellSize);
    const gridY = Math.floor(localY / this.cellSize);

    if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
      if (this.currentBrush === 'water') {
        this.mapData[gridY]![gridX] = 0;
        this.refreshGrid();
      } else if (this.currentBrush.startsWith('tile_')) {
        const tileIdMap: Record<string, number> = {
          'tile_top_left': 1, 'tile_top_mid': 2, 'tile_top_right': 3,
          'tile_mid_left': 10, 'tile_middle': 11, 'tile_mid_right': 12,
          'tile_bot_left': 19, 'tile_bot_mid': 20, 'tile_bot_right': 21
        };
        this.mapData[gridY]![gridX] = tileIdMap[this.currentBrush] ?? 11;
        this.refreshGrid();
      } else if (this.currentBrush.startsWith('obs_') || this.currentBrush.startsWith('fence_')) {
        // Place obstacle
        this.obstacles = this.obstacles.filter(o => o.x !== gridX || o.y !== gridY);
        this.obstacles.push({ type: this.currentBrush, x: gridX, y: gridY });
        this.refreshGrid();
      } else if (this.currentBrush.startsWith('enemy_')) {
        // Place enemy
        this.enemies = this.enemies.filter(o => o.x !== gridX || o.y !== gridY);
        this.enemies.push({ type: this.currentBrush, x: gridX, y: gridY });
        this.refreshGrid();
      } else if (this.currentBrush === 'eraser') {
        // Erase entities, obstacles, and enemies
        this.obstacles = this.obstacles.filter(o => o.x !== gridX || o.y !== gridY);
        this.enemies = this.enemies.filter(o => o.x !== gridX || o.y !== gridY);
        if (this.redStart?.x === gridX && this.redStart?.y === gridY) this.redStart = null;
        if (this.blueStart?.x === gridX && this.blueStart?.y === gridY) this.blueStart = null;
        if (this.redDest?.x === gridX && this.redDest?.y === gridY) this.redDest = null;
        if (this.blueDest?.x === gridX && this.blueDest?.y === gridY) this.blueDest = null;
        this.refreshGrid();
      } else {
        // Place entity (re-assigning on drag is fine since there's only one instance)
        if (this.currentBrush === 'red_start') this.redStart = { x: gridX, y: gridY };
        if (this.currentBrush === 'blue_start') this.blueStart = { x: gridX, y: gridY };
        if (this.currentBrush === 'red_dest') this.redDest = { x: gridX, y: gridY };
        if (this.currentBrush === 'blue_dest') this.blueDest = { x: gridX, y: gridY };
        this.refreshGrid();
      }
    }
  }

  refreshGrid() {
    const idToTex: Record<number, string> = {
      1: 'tile_top_left', 2: 'tile_top_mid', 3: 'tile_top_right',
      10: 'tile_mid_left', 11: 'tile_middle', 12: 'tile_mid_right',
      19: 'tile_bot_left', 20: 'tile_bot_mid', 21: 'tile_bot_right'
    };

    // Update manual tiles
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const id = this.mapData[y]![x] ?? 0;
        if (id === 0) {
          this.tileImages[y]![x]!.setVisible(false);
        } else {
          this.tileImages[y]![x]!.setVisible(true);
          this.tileImages[y]![x]!.setTexture(idToTex[id] || 'tile_middle');
        }
      }
    }

    // Update entity positions
    const updateEntity = (key: string, pos: Pos | null, offsetY = 0) => {
      const sprite = this.entitySprites[key];
      if (!sprite) return;
      if (pos) {
        sprite.setPosition(
          pos.x * this.cellSize + this.cellSize / 2,
          pos.y * this.cellSize + this.cellSize / 2 + offsetY
        );
        sprite.setVisible(true);
      } else {
        sprite.setVisible(false);
      }
    };

    updateEntity('red_dest', this.redDest);
    updateEntity('blue_dest', this.blueDest);
    updateEntity('red_start', this.redStart, -8);
    updateEntity('blue_start', this.blueStart, -8);

    // Update obstacles
    this.obstacleImages.forEach(img => img.destroy());
    this.obstacleImages = [];
    this.obstacles.forEach(obs => {
      const isFence = obs.type.startsWith('fence_');
      const offsetY = isFence ? 0 : -8;
      
      const img = this.add.image(
        obs.x * this.cellSize + this.cellSize / 2, 
        obs.y * this.cellSize + this.cellSize / 2 + offsetY,
        obs.type
      );
      // Don't squish the aspect ratio, scale relative to cell width
      const scaleRatio = isFence ? 1.0 : 0.9;
      const scale = (this.cellSize * scaleRatio) / img.width;
      img.setScale(scale);
      this.gridContainer.add(img);
      this.obstacleImages.push(img);
    });

    // Update enemies
    this.enemyImages.forEach(img => img.destroy());
    this.enemyImages = [];
    this.enemies.forEach(enemy => {
      const img = this.add.image(
        enemy.x * this.cellSize + this.cellSize / 2, 
        enemy.y * this.cellSize + this.cellSize / 2 - 8,
        enemy.type
      );
      const scale = (this.cellSize * 0.9) / img.width;
      img.setScale(scale);
      this.gridContainer.add(img);
      this.enemyImages.push(img);
    });
  }

  createPalette() {
    const bg = this.add.rectangle(0, 0, 320, 650, 0x333333).setOrigin(0.5);
    this.uiContainer.add(bg);

    this.brushText = this.add.text(0, 270, 'Current Brush:\nGrass (Middle)', { fontSize: '20px', align: 'center' }).setOrigin(0.5);
    this.uiContainer.add(this.brushText);

    const allBrushes: { type: BrushType, label: string, emoji?: string }[] = [
      // Row 1 & 2: Main Tools
      { type: 'water', label: 'Water', emoji: '🟦' },
      { type: 'red_start', label: 'Red Start', emoji: '🔴' },
      { type: 'blue_start', label: 'Blue Start', emoji: '🔵' },
      { type: 'eraser', label: 'Eraser', emoji: '🧼' },
      { type: 'red_dest', label: 'Red Dest', emoji: '❌' },
      { type: 'blue_dest', label: 'Blue Dest', emoji: '❎' },
      // Row 3, 4, 5: Ground
      { type: 'tile_top_left', label: 'Top Left Edge', emoji: '▛' },
      { type: 'tile_top_mid', label: 'Top Mid Edge', emoji: '▀' },
      { type: 'tile_top_right', label: 'Top Right Edge', emoji: '▜' },
      { type: 'tile_mid_left', label: 'Mid Left Edge', emoji: '▌' },
      { type: 'tile_middle', label: 'Middle', emoji: '🟩' },
      { type: 'tile_mid_right', label: 'Mid Right Edge', emoji: '▐' },
      { type: 'tile_bot_left', label: 'Bot Left Edge', emoji: '▙' },
      { type: 'tile_bot_mid', label: 'Bot Mid Edge', emoji: '▄' },
      { type: 'tile_bot_right', label: 'Bot Right Edge', emoji: '▟' },
      // Row 6, 7: Obstacles
      { type: 'obs_bush1', label: 'Bush', emoji: '🌳' },
      { type: 'obs_pumpkin1', label: 'Pumpkin 1', emoji: '🎃' },
      { type: 'obs_pumpkin2', label: 'Pumpkin 2', emoji: '🎃' },
      { type: 'obs_rock', label: 'Rock', emoji: '🪨' },
      { type: 'enemy_barrel', label: 'Enemy Barrel', emoji: '🛢️' },
      // Row 7, 8, 9: Fences
      { type: 'fence_left_bottom', label: 'Fence LB' },
      { type: 'fence_left_connected_mid_open', label: 'Fence L Conn' },
      { type: 'fence_left_middle', label: 'Fence LM' },
      { type: 'fence_right_bottom', label: 'Fence RB' },
      { type: 'fence_right_connect_mid_open', label: 'Fence R Conn' },
      { type: 'fence_right_middle', label: 'Fence RM' },
      { type: 'fence_top_left', label: 'Fence TL' },
      { type: 'fence_top_middle_one', label: 'Fence TM1' },
      { type: 'fence_top_middle_two', label: 'Fence TM2' },
      { type: 'fence_top_right', label: 'Fence TR' }
    ];

    const cols = 4;
    const padding = 60;
    const startX = -((cols - 1) * padding) / 2;
    const startY = -270;

    allBrushes.forEach((brush, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = startX + (col * padding);
      const y = startY + (row * padding);

      if (brush.emoji) {
        const btn = this.add.text(x, y, brush.emoji, {
          fontSize: '24px',
          backgroundColor: '#555',
          padding: { x: 8, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        btn.on('pointerdown', () => {
          this.currentBrush = brush.type;
          this.brushText.setText(`Current Brush:\n${brush.label}`);
        });
        this.uiContainer.add(btn);
      } else {
        const btnBg = this.add.rectangle(x, y, 48, 48, 0x555555).setInteractive({ useHandCursor: true });
        const img = this.add.image(x, y, brush.type).setDisplaySize(40, 40);
        
        btnBg.on('pointerdown', () => {
          this.currentBrush = brush.type;
          this.brushText.setText(`Current Brush:\n${brush.label}`);
        });
        img.on('pointerdown', () => btnBg.emit('pointerdown'));
        
        this.uiContainer.add([btnBg, img]);
      }
    });
  }

  generateMapJSON(): string {
    const groundData: number[] = [];
    const waterData: number[] = [];

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        waterData.push(55); // Water layer is always full of water
        const id = this.mapData[y]![x] ?? 0;
        groundData.push(id); // If 0, it outputs 0. Else outputs the correct Tiled ID.
      }
    }

    const objectsList = [
      { "id": 1, "name": "red_start", "x": this.redStart!.x * this.cellSize, "y": this.redStart!.y * this.cellSize, "width": 0, "height": 0 },
      { "id": 2, "name": "blue_start", "x": this.blueStart!.x * this.cellSize, "y": this.blueStart!.y * this.cellSize, "width": 0, "height": 0 },
      { "id": 3, "name": "red_dest", "x": this.redDest!.x * this.cellSize, "y": this.redDest!.y * this.cellSize, "width": 0, "height": 0 },
      { "id": 4, "name": "blue_dest", "x": this.blueDest!.x * this.cellSize, "y": this.blueDest!.y * this.cellSize, "width": 0, "height": 0 }
    ];

    const obstaclesList = this.obstacles.map((obs, i) => ({
      "id": 100 + i,
      "name": obs.type,
      "x": obs.x * this.cellSize,
      "y": obs.y * this.cellSize,
      "width": 0,
      "height": 0
    }));

    const enemiesList = this.enemies.map((enemy, i) => ({
      "id": 200 + i,
      "name": enemy.type,
      "x": enemy.x * this.cellSize,
      "y": enemy.y * this.cellSize,
      "width": 0,
      "height": 0
    }));

    const json = {
      "compressionlevel": -1,
      "height": this.gridHeight,
      "infinite": false,
      "layers": [
        {
          "data": waterData,
          "height": this.gridHeight,
          "id": 2,
          "name": "water",
          "opacity": 1,
          "type": "tilelayer",
          "visible": true,
          "width": this.gridWidth,
          "x": 0,
          "y": 0
        },
        {
          "data": groundData,
          "height": this.gridHeight,
          "id": 1,
          "name": "ground",
          "opacity": 1,
          "type": "tilelayer",
          "visible": true,
          "width": this.gridWidth,
          "x": 0,
          "y": 0
        },
        {
          "id": 3,
          "name": "spawn_points",
          "type": "objectgroup",
          "visible": true,
          "objects": objectsList
        },
        {
          "id": 4,
          "name": "obstacles",
          "type": "objectgroup",
          "visible": true,
          "objects": obstaclesList
        },
        {
          "id": 5,
          "name": "enemies",
          "type": "objectgroup",
          "visible": true,
          "objects": enemiesList
        }
      ],
      "nextlayerid": 6,
      "nextobjectid": 6,
      "orientation": "orthogonal",
      "renderorder": "right-down",
      "tiledversion": "1.11.2",
      "tileheight": this.cellSize,
      "tilesets": [
        {
          "firstgid": 1,
          "name": "Tilemap_color1",
          "tilewidth": 64,
          "tileheight": 64,
          "tilecount": 54,
          "columns": 9,
          "image": "../Tilemap_color1.png",
          "imagewidth": 576,
          "imageheight": 384
        },
        {
          "firstgid": 55,
          "name": "Water Background color",
          "tilewidth": 64,
          "tileheight": 64,
          "tilecount": 1,
          "columns": 1,
          "image": "../WaterBackground.png",
          "imagewidth": 64,
          "imageheight": 64
        }
      ],
      "tilewidth": this.cellSize,
      "type": "map",
      "version": "1.10",
      "width": this.gridWidth
    };

    return JSON.stringify(json, null, 2);
  }

  showPublishPrompt(jsonString: string) {
    if (!this.redStart || !this.blueStart || !this.redDest || !this.blueDest) {
      alert('You must place both Knights and their Destinations before publishing!');
      return;
    }

    // Create an HTML overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    overlay.style.color = 'white';
    overlay.style.fontFamily = 'Arial, sans-serif';

    const title = document.createElement('h2');
    title.innerText = 'Publish Level to Reddit';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter a catchy name for your level...';
    input.style.padding = '10px';
    input.style.fontSize = '18px';
    input.style.width = '80%';
    input.style.maxWidth = '400px';
    input.style.marginBottom = '20px';
    input.style.borderRadius = '5px';
    input.style.border = 'none';

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '20px';

    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = 'Cancel';
    cancelBtn.style.padding = '10px 20px';
    cancelBtn.style.fontSize = '18px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.onclick = () => overlay.remove();

    const publishBtn = document.createElement('button');
    publishBtn.innerText = 'Publish';
    publishBtn.style.padding = '10px 20px';
    publishBtn.style.fontSize = '18px';
    publishBtn.style.backgroundColor = '#47aba9';
    publishBtn.style.color = 'white';
    publishBtn.style.border = 'none';
    publishBtn.style.borderRadius = '5px';
    publishBtn.style.cursor = 'pointer';

    publishBtn.onclick = async () => {
      const levelTitle = input.value.trim();
      if (!levelTitle) {
        input.style.border = '2px solid red';
        return;
      }
      publishBtn.innerText = 'Publishing...';
      publishBtn.disabled = true;

      try {
        const res = await fetch('/api/publish-level', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: levelTitle,
            levelData: jsonString
          })
        });
        const data = await res.json();
        if (data.url) {
          overlay.remove();
          navigateTo(data.url);
        } else {
          publishBtn.innerText = 'Failed';
          publishBtn.disabled = false;
        }
      } catch (e) {
        console.error(e);
        publishBtn.innerText = 'Error';
        publishBtn.disabled = false;
      }
    };

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(publishBtn);

    overlay.appendChild(title);
    overlay.appendChild(input);
    overlay.appendChild(btnContainer);

    document.body.appendChild(overlay);
    input.focus();
  }

  showToast(msg: string) {
    const toast = this.add.text(this.scale.width / 2, 150, msg, {
      fontSize: '24px',
      backgroundColor: '#000',
      color: '#fff',
      padding: { x: 15, y: 10 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: toast,
      alpha: 0,
      duration: 1000,
      delay: 2000,
      onComplete: () => toast.destroy()
    });
  }

  updateLayout(width: number, height: number) {
    this.cameras.resize(width, height);
    this.publishBtn.setPosition(width - 20, 20);

    const totalGridWidth = this.gridWidth * this.cellSize;
    const totalGridHeight = this.gridHeight * this.cellSize;
    
    // Left sidebar is ~320px wide. Right side is for the grid.
    const sidebarWidth = Math.min(320, width * 0.4);
    const availableGridWidth = width - sidebarWidth;
    
    const scaleFactor = Math.min(availableGridWidth / (totalGridWidth + 40), height / (totalGridHeight + 100), 1);
    
    this.gridContainer.setScale(scaleFactor);
    
    const scaledGridW = totalGridWidth * scaleFactor;
    const scaledGridH = totalGridHeight * scaleFactor;
    
    this.gridContainer.setPosition(
      sidebarWidth + (availableGridWidth - scaledGridW) / 2,
      (height - scaledGridH) / 2
    );

    // Sidebar UI on the left
    this.uiContainer.setPosition(sidebarWidth / 2, height / 2);
    const uiScale = Math.min(1, height / 700);
    this.uiContainer.setScale(uiScale);
  }
}
