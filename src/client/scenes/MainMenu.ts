import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene {
  background: GameObjects.Image | null = null;
  logo: GameObjects.Image | null = null;
  title: GameObjects.Text | null = null;
  playBtn: GameObjects.Text | null = null;
  designerBtn: GameObjects.Text | null = null;

  constructor() {
    super('MainMenu');
  }

  /**
   * Reset cached GameObject references every time the scene starts.
   * The same Scene instance is reused by Phaser, so we must ensure
   * stale (destroyed) objects are cleared out when the scene restarts.
   */
  init(): void {
    this.background = null;
    this.logo = null;
    this.title = null;
    this.playBtn = null;
    this.designerBtn = null;
  }

  create() {
    this.refreshLayout();

    // Re-calculate positions whenever the game canvas is resized (e.g. orientation change).
    this.scale.on('resize', () => this.refreshLayout());
  }

  /**
   * Positions and (lightly) scales all UI elements based on the current game size.
   * Call this from create() and from any resize events.
   */
  private refreshLayout(): void {
    const { width, height } = this.scale;

    // Resize camera to new viewport to prevent black bars
    this.cameras.resize(width, height);

    // Background – stretch to fill the whole canvas
    if (!this.background) {
      this.background = this.add.image(0, 0, 'background').setOrigin(0);
    }
    this.background!.setDisplaySize(width, height);

    // Logo – keep aspect but scale down for very small screens
    const scaleFactor = Math.min(width / 1024, height / 768);

    if (!this.logo) {
      this.logo = this.add.image(0, 0, 'logo');
    }
    this.logo!.setPosition(width / 2, height * 0.38).setScale(scaleFactor);

    // Title text – create once, then scale on resize
    const baseFontSize = 38;
    if (!this.title) {
      this.title = this.add
        .text(0, 0, 'Main Menu', {
          fontFamily: 'Arial Black',
          fontSize: `${baseFontSize}px`,
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 8,
          align: 'center',
        })
        .setOrigin(0.5);
    }
    this.title!.setPosition(width / 2, height * 0.6);
    this.title!.setScale(scaleFactor);

    // Play Button
    if (!this.playBtn) {
      this.playBtn = this.add.text(0, 0, 'Play Game', {
        fontSize: '32px',
        backgroundColor: '#444',
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scene.start('Game'));
    }
    this.playBtn!.setPosition(width / 2, height * 0.75);
    this.playBtn!.setScale(scaleFactor);

    // Designer Button
    if (!this.designerBtn) {
      this.designerBtn = this.add.text(0, 0, 'Level Designer', {
        fontSize: '32px',
        backgroundColor: '#444',
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          if (this.sys.game.device.os.desktop) {
            this.scene.start('LevelDesigner');
          } else {
            this.showPopup("The Level Designer is\nonly available on Desktop.");
          }
        });
    }
    this.designerBtn!.setPosition(width / 2, height * 0.85);
    this.designerBtn!.setScale(scaleFactor);
  }

  showPopup(msg: string) {
    const popup = this.add.container(this.scale.width / 2, this.scale.height / 2);
    
    const bg = this.add.rectangle(0, 0, 400, 200, 0x000000, 0.9);
    bg.setStrokeStyle(4, 0xffffff);
    
    const text = this.add.text(0, -20, msg, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    const okBtn = this.add.text(0, 60, 'OK', {
      fontSize: '24px',
      backgroundColor: '#555',
      padding: { x: 30, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        popup.destroy();
      });

    popup.add([bg, text, okBtn]);
    
    // Scale popup with game size
    const scaleFactor = Math.min(this.scale.width / 1024, this.scale.height / 768, 1);
    popup.setScale(scaleFactor);
  }
}
