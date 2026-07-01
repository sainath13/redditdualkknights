import { Scene } from 'phaser';
import * as Phaser from 'phaser';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  
  // Grid config
  gridWidth = 6;
  gridHeight = 9;
  cellSize = 64;
  
  // Game State
  redPos = { x: 1, y: 1 };
  bluePos = { x: 4, y: 3 };
  redFinalPos = { x: 1, y: 0 };
  blueFinalPos = { x: 4, y: 4 };
  
  // Sprites
  gridContainer: Phaser.GameObjects.Container;
  redKnight: Phaser.GameObjects.Image;
  blueKnight: Phaser.GameObjects.Image;
  
  // UI
  uiContainer: Phaser.GameObjects.Container;
  gameOver = false;

  constructor() {
    super('Game');
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x222222);

    this.background = this.add.image(512, 384, 'background').setAlpha(0.25);

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
    // Background tiles
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const tile = this.add.image(
          x * this.cellSize + this.cellSize / 2, 
          y * this.cellSize + this.cellSize / 2, 
          'tile'
        );
        // Scale tile if it's not matching cellSize exactly
        tile.setDisplaySize(this.cellSize, this.cellSize);
        this.gridContainer.add(tile);
      }
    }
    
    // Destinations
    const redFinal = this.add.image(
      this.redFinalPos.x * this.cellSize + this.cellSize / 2,
      this.redFinalPos.y * this.cellSize + this.cellSize / 2,
      'redfinal'
    );
    redFinal.setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8);
    this.gridContainer.add(redFinal);

    const blueFinal = this.add.image(
      this.blueFinalPos.x * this.cellSize + this.cellSize / 2,
      this.blueFinalPos.y * this.cellSize + this.cellSize / 2,
      'bluefinal'
    );
    blueFinal.setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8);
    this.gridContainer.add(blueFinal);
  }

  createKnights() {
    this.redKnight = this.add.image(0, 0, 'redknight');
    this.redKnight.setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8);
    
    this.blueKnight = this.add.image(0, 0, 'blueknight');
    this.blueKnight.setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8);
    
    this.gridContainer.add(this.redKnight);
    this.gridContainer.add(this.blueKnight);
    
    this.updateKnightPositions(false);
  }

  createControls() {
    const createBtn = (x: number, y: number, label: string, dx: number, dy: number) => {
      const btn = this.add.text(x, y, label, {
        fontSize: '48px',
        backgroundColor: '#444',
        padding: { x: 10, y: 10 }
      }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.move(dx, dy));
      this.uiContainer.add(btn);
    };

    // Arrange buttons in a D-pad layout
    createBtn(0, -60, '⬆️', 0, -1);
    createBtn(0, 60, '⬇️', 0, 1);
    createBtn(-60, 0, '⬅️', -1, 0);
    createBtn(60, 0, '➡️', 1, 0);
  }

  updateLayout(width: number, height: number) {
    this.cameras.resize(width, height);
    if (this.background) {
      this.background.setPosition(width / 2, height / 2);
      const scale = Math.max(width / this.background.width, height / this.background.height);
      this.background.setScale(scale);
    }

    // Center grid
    const totalGridWidth = this.gridWidth * this.cellSize;
    const totalGridHeight = this.gridHeight * this.cellSize;
    
    const scaleFactor = Math.min(width / (totalGridWidth + 40), height / (totalGridHeight + 200), 1);
    
    this.gridContainer.setScale(scaleFactor);
    
    const scaledGridW = totalGridWidth * scaleFactor;
    const scaledGridH = totalGridHeight * scaleFactor;
    
    this.gridContainer.setPosition(
      (width - scaledGridW) / 2,
      (height - scaledGridH) / 2 - 50 * scaleFactor // Shift up slightly for controls
    );

    // Center UI (controls) below the grid
    this.uiContainer.setPosition(width / 2, height - 100);
    this.uiContainer.setScale(scaleFactor);
  }

  move(dx: number, dy: number) {
    if (this.gameOver) return;

    let redMoved = false;
    const newRedX = this.redPos.x + dx;
    const newRedY = this.redPos.y + dy;
    
    if (newRedX >= 0 && newRedX < this.gridWidth && newRedY >= 0 && newRedY < this.gridHeight) {
      this.redPos.x = newRedX;
      this.redPos.y = newRedY;
      redMoved = true;
    }

    let blueMoved = false;
    const newBlueX = this.bluePos.x - dx; // opposite direction
    const newBlueY = this.bluePos.y - dy; // opposite direction
    
    if (newBlueX >= 0 && newBlueX < this.gridWidth && newBlueY >= 0 && newBlueY < this.gridHeight) {
      this.bluePos.x = newBlueX;
      this.bluePos.y = newBlueY;
      blueMoved = true;
    }

    if (redMoved || blueMoved) {
      this.updateKnightPositions(true);
      this.checkWinCondition();
    }
  }

  updateKnightPositions(animate = false) {
    const rx = this.redPos.x * this.cellSize + this.cellSize / 2;
    const ry = this.redPos.y * this.cellSize + this.cellSize / 2;
    
    const bx = this.bluePos.x * this.cellSize + this.cellSize / 2;
    const by = this.bluePos.y * this.cellSize + this.cellSize / 2;

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
