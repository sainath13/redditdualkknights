import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene {
  background: GameObjects.Image | null = null;
  logo: GameObjects.Image | null = null;
  playBtn: GameObjects.Container | null = null;
  designerBtn: GameObjects.Container | null = null;

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

    // Better responsive scaling: keep aspect but ensure it doesn't shrink to microscopic sizes on phones
    let scaleFactor = Math.min(width / 1024, height / 768);
    
    // If on a portrait screen or narrow phone, scale based on a narrower reference width 
    // so the UI remains large and readable.
    if (width < 800) {
      scaleFactor = width / 450; 
    }

    if (!this.logo) {
      this.logo = this.add.image(0, 0, 'logo');
    }
    this.logo!.setPosition(width / 2, height * 0.38).setScale(scaleFactor);

    // Play Button
    if (!this.playBtn) {
      this.playBtn = this.add.container(0, 0);
      
      const img = this.add.image(0, 0, 'menu_btn').setInteractive({ useHandCursor: true });
      img.setDisplaySize(240, 65);
      const txt = this.add.text(0, -4, 'Play Game', {
        fontFamily: 'Patrick Hand',
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);

      img.on('pointerdown', () => {
        img.setTexture('menu_btn_pressed');
        txt.setY(0); // push text down when pressed
      });
      img.on('pointerup', () => {
        img.setTexture('menu_btn');
        txt.setY(-4);
        this.scene.start('Game');
      });
      img.on('pointerout', () => {
        img.setTexture('menu_btn');
        txt.setY(-4);
      });

      this.playBtn.add([img, txt]);
    }
    this.playBtn!.setPosition(width / 2, height * 0.72);
    this.playBtn!.setScale(scaleFactor);

    // Designer Button
    if (!this.designerBtn) {
      this.designerBtn = this.add.container(0, 0);
      
      const img = this.add.image(0, 0, 'menu_btn').setInteractive({ useHandCursor: true });
      img.setDisplaySize(260, 65);
      const txt = this.add.text(0, -4, 'Level Designer', {
        fontFamily: 'Patrick Hand',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);

      img.on('pointerdown', () => {
        img.setTexture('menu_btn_pressed');
        txt.setY(0);
      });
      img.on('pointerup', () => {
        img.setTexture('menu_btn');
        txt.setY(-4);
        if (this.sys.game.device.os.desktop) {
          this.showBaseSelectionPopup();
        } else {
          this.showPopup("The Level Designer is\nonly available on Desktop.");
        }
      });
      img.on('pointerout', () => {
        img.setTexture('menu_btn');
        txt.setY(-4);
      });

      this.designerBtn.add([img, txt]);
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
    title.style.fontFamily = 'Patrick Hand, cursive';
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
      btn.style.fontFamily = 'Patrick Hand';
      btn.style.cursor = 'pointer';
      btn.style.color = 'white';
      btn.style.border = 'none';
      btn.style.background = 'url("assets/woodentable/bigBlueButtonUnpressed.png") center/100% 100% no-repeat';
      btn.style.textShadow = '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000';
      btn.style.minWidth = '200px'; // Give it some width
      btn.style.backgroundColor = 'transparent'; // prevent default background
      
      btn.onmouseout = () => {
         btn.style.background = 'url("assets/woodentable/bigBlueButtonUnpressed.png") center/100% 100% no-repeat';
      };
      btn.onmousedown = () => {
         btn.style.background = 'url("assets/woodentable/bluebuttonPressed.png") center/100% 100% no-repeat';
      };
      btn.onmouseup = () => {
         btn.style.background = 'url("assets/woodentable/bigBlueButtonUnpressed.png") center/100% 100% no-repeat';
      };
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

    const scratchContainer = document.createElement('div');
    scratchContainer.style.display = 'flex';
    scratchContainer.style.flexDirection = 'column';
    scratchContainer.style.gap = '10px';
    scratchContainer.style.marginTop = '20px';
    scratchContainer.style.alignItems = 'center';

    const inputContainer = document.createElement('div');
    inputContainer.style.display = 'none';
    inputContainer.style.gap = '10px';
    inputContainer.style.alignItems = 'center';

    const spanW = document.createElement('span');
    spanW.innerText = 'W:';
    spanW.style.color = 'white';

    const widthInput = document.createElement('input');
    widthInput.type = 'number';
    widthInput.value = '6';
    widthInput.style.width = '50px';
    widthInput.style.padding = '5px';

    const spanH = document.createElement('span');
    spanH.innerText = 'H:';
    spanH.style.color = 'white';

    const heightInput = document.createElement('input');
    heightInput.type = 'number';
    heightInput.value = '8';
    heightInput.style.width = '50px';
    heightInput.style.padding = '5px';

    const scratchBtn = createBtn('Start from Scratch', () => {
      if (inputContainer.style.display === 'none') {
        inputContainer.style.display = 'flex';
        scratchBtn.style.display = 'none';
      }
    });
    
    const confirmScratchBtn = createBtn('Go', () => {
      const w = parseInt(widthInput.value) || 6;
      const h = parseInt(heightInput.value) || 8;
      overlay.remove();
      this.scene.start('LevelDesigner', { gridWidth: w, gridHeight: h });
    });
    confirmScratchBtn.style.minWidth = 'auto'; // let it shrink for "Go"
    confirmScratchBtn.style.padding = '10px 20px';

    inputContainer.appendChild(spanW);
    inputContainer.appendChild(widthInput);
    inputContainer.appendChild(spanH);
    inputContainer.appendChild(heightInput);
    inputContainer.appendChild(confirmScratchBtn);

    scratchContainer.appendChild(scratchBtn);
    scratchContainer.appendChild(inputContainer);
    btnContainer.appendChild(scratchContainer);

    const cancelBtn = createBtn('Cancel', () => overlay.remove());
    btnContainer.appendChild(cancelBtn);

    document.body.appendChild(overlay);
  }

  showPopup(msg: string) {
    const popup = this.add.container(this.scale.width / 2, this.scale.height / 2);
    
    const bg = this.add.image(0, 0, 'popup_bg');
    bg.setDisplaySize(400, 240);
    
    const text = this.add.text(0, -40, msg, {
      fontFamily: 'Patrick Hand',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: 336, useAdvancedWrap: true }
    }).setOrigin(0.5);

    const bannerWidth = Math.max(128, text.width + 60);
    const bannerHeight = Math.max(128, text.height + 60);
    const banner = this.add.nineslice(0, -40, 'banner_slots', undefined, bannerWidth, bannerHeight, 64, 64, 64, 64, true, true).setOrigin(0.5);

    const okBtn = this.add.container(0, 70);
    const okImg = this.add.image(0, 0, 'menu_btn').setInteractive({ useHandCursor: true });
    okImg.setDisplaySize(140, 50); // smaller button for popup
    
    const okText = this.add.text(0, -4, 'OK', {
      fontFamily: 'Patrick Hand',
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
      popup.destroy();
    });
    okImg.on('pointerout', () => {
      okImg.setTexture('menu_btn');
      okText.setY(-4);
    });

    okBtn.add([okImg, okText]);

    popup.add([bg, banner, text, okBtn]);
    
    // Scale popup with game size
    let scaleFactor = Math.min(this.scale.width / 1024, this.scale.height / 768, 1.5);
    if (this.scale.width < 800) {
      scaleFactor = this.scale.width / 400; // Large and readable on mobile phones
    }
    popup.setScale(scaleFactor);
  }
}
