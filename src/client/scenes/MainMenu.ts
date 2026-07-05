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
            this.showBaseSelectionPopup();
          } else {
            this.showPopup("The Level Designer is\nonly available on Desktop.");
          }
        });
    }
    this.designerBtn!.setPosition(width / 2, height * 0.85);
    this.designerBtn!.setScale(scaleFactor);
  }

  private showBaseSelectionPopup() {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '1000';

    const title = document.createElement('h1');
    title.innerText = 'Select Base Level';
    title.style.color = 'white';
    title.style.fontFamily = 'Arial, sans-serif';
    title.style.marginBottom = '20px';
    overlay.appendChild(title);

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.flexDirection = 'column';
    btnContainer.style.gap = '10px';
    overlay.appendChild(btnContainer);

    // Retrieve list from cache
    let bases: string[] = [];
    try {
      bases = this.cache.json.get('baselevelmanifest') || [];
    } catch (e) {
      console.error(e);
    }

    const createBtn = (text: string, onClick: () => void) => {
      const btn = document.createElement('button');
      btn.innerText = text;
      btn.style.padding = '15px 30px';
      btn.style.fontSize = '18px';
      btn.style.cursor = 'pointer';
      btn.style.backgroundColor = '#444';
      btn.style.color = 'white';
      btn.style.border = 'none';
      btn.style.borderRadius = '5px';
      btn.onmouseover = () => btn.style.backgroundColor = '#666';
      btn.onmouseout = () => btn.style.backgroundColor = '#444';
      btn.onclick = onClick;
      return btn;
    };

    bases.forEach(baseFile => {
      const btn = createBtn(baseFile, async () => {
        btn.innerText = 'Loading...';
        btn.disabled = true;
        try {
          const res = await fetch('assets/baseleveldata/' + baseFile);
          if (!res.ok) throw new Error('Failed to fetch');
          const data = await res.json();
          overlay.remove();
          this.scene.start('LevelDesigner', { baseMap: data });
        } catch (error) {
          console.error(error);
          btn.innerText = 'Failed!';
          setTimeout(() => overlay.remove(), 1000);
        }
      });
      btnContainer.appendChild(btn);
    });

    const scratchBtn = createBtn('Start from Scratch', () => {
      overlay.remove();
      this.scene.start('LevelDesigner');
    });
    scratchBtn.style.backgroundColor = '#47aba9';
    scratchBtn.onmouseout = () => scratchBtn.style.backgroundColor = '#47aba9';
    scratchBtn.style.marginTop = '20px';
    btnContainer.appendChild(scratchBtn);

    const cancelBtn = createBtn('Cancel', () => overlay.remove());
    cancelBtn.style.backgroundColor = '#ff4444';
    cancelBtn.onmouseout = () => cancelBtn.style.backgroundColor = '#ff4444';
    btnContainer.appendChild(cancelBtn);

    document.body.appendChild(overlay);
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
