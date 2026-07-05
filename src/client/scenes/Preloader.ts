import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, 'background');

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on('progress', (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    //  Load the assets for the game
    this.load.setPath('../assets');

    this.load.image('logo', 'logo.png');
    
    // Knights assets
    this.load.spritesheet('redknight', 'knights/red_knight_Idle.png', { frameWidth: 192, frameHeight: 192 });
    this.load.spritesheet('blueknight', 'knights/blue_knight_Idle.png', { frameWidth: 192, frameHeight: 192 });
    this.load.image('tile', 'knights/tilesingle.png');
    
    // Destinations
    this.load.image('btn_red', 'destination/Button_Red.png');
    this.load.image('btn_red_pressed', 'destination/Button_Red_Pressed.png');
    this.load.image('btn_blue', 'destination/Button_Blue.png');
    this.load.image('btn_blue_pressed', 'destination/Button_Blue_Pressed.png');

    // Ground tiles for Level Designer
    this.load.image('tile_top_left', 'tiles_for_ground/top_left_edge.png');
    this.load.image('tile_top_mid', 'tiles_for_ground/top_middle_edge.png');
    this.load.image('tile_top_right', 'tiles_for_ground/top_right_edge.png');
    this.load.image('tile_mid_left', 'tiles_for_ground/mid_left_edge.png');
    this.load.image('tile_middle', 'tiles_for_ground/middle.png');
    this.load.image('tile_mid_right', 'tiles_for_ground/mid_right_edge.png');
    this.load.image('tile_bot_left', 'tiles_for_ground/bottom_left_edge.png');
    this.load.image('tile_bot_mid', 'tiles_for_ground/bottom_mid_edge.png');
    this.load.image('tile_bot_right', 'tiles_for_ground/bottom_right_edge.png');
    
    // Obstacles
    this.load.image('obs_bush1', 'obstacles/bush1.png');
    this.load.image('obs_pumpkin1', 'obstacles/pumpkin1.png');
    this.load.image('obs_pumpkin2', 'obstacles/pumpkin2.png');
    this.load.image('obs_rock', 'obstacles/rock.png');
    // Enemies
    this.load.image('enemy_barrel', 'enemy/singleredbarel.png');
    
    // HUD buttons
    this.load.image('btn_close', 'other_buttons/close_button.png');
    this.load.image('btn_close_pressed', 'other_buttons/close_button_pressed.png');
    this.load.image('btn_steps', 'other_buttons/steps_button.png');
    this.load.image('btn_steps_pressed', 'other_buttons/steps_button_pressed.png');
    this.load.image('btn_replay', 'other_buttons/replay_button.png');
    this.load.image('btn_replay_pressed', 'other_buttons/replay_button_pressed.png');
    
    // Arrow buttons
    this.load.image('arrow_up', 'arrow_buttons/up_button.png');
    this.load.image('arrow_up_pressed', 'arrow_buttons/up_button_pressed.png');
    this.load.image('arrow_down', 'arrow_buttons/down_button.png');
    this.load.image('arrow_down_pressed', 'arrow_buttons/down_button_pressed.png');
    this.load.image('arrow_left', 'arrow_buttons/left_button.png');
    this.load.image('arrow_left_pressed', 'arrow_buttons/left_button_pressed.png');
    this.load.image('arrow_right', 'arrow_buttons/right_button.png');
    this.load.image('arrow_right_pressed', 'arrow_buttons/right_button_pressed.png');
    
    // Map data
    this.load.tilemapTiledJSON('baselevelnine', 'tiledthings/levels/baselevelnine.json');

    // Landscape tilemap
    this.load.image('landscape_tiles', 'tiledthings/Tilemap_color1.png');
    this.load.image('water_tiles', 'tiledthings/WaterBackground.png');
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start('MainMenu');
  }
}
