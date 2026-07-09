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
    this.load.spritesheet('enemy_barrel', 'enemy/animating_barrel.png', { frameWidth: 86, frameHeight: 86 });
    this.load.spritesheet('explosion', 'enemy/animating_explosion_dead.png', { frameWidth: 128, frameHeight: 128 });
    
    // Fences
    this.load.image('fence_left_bottom', 'fence/left_bottom_fence.png');
    this.load.image('fence_left_connected_mid_open', 'fence/left_connected_mid_open_fence.png');
    this.load.image('fence_left_middle', 'fence/left_middle_fence.png');
    this.load.image('fence_right_bottom', 'fence/right_bottom_fence.png');
    this.load.image('fence_right_connect_mid_open', 'fence/right_connect_mid_open_fence.png');
    this.load.image('fence_right_middle', 'fence/right_middle_fence.png');
    this.load.image('fence_top_left', 'fence/top_left_fence.png');
    this.load.image('fence_top_middle_one', 'fence/top_middle_one_fence.png');
    this.load.image('fence_top_middle_two', 'fence/top_middle_two_fence.png');
    this.load.image('fence_top_right', 'fence/top_right_fence.png');
    
    // Cliffs
    this.load.image('cliff_middle_edge', 'cliff/cliff_middle_edge.png');
    this.load.image('cliff_right_edge', 'cliff/cliff_right_edge.png');
    this.load.image('cliff_left_edge', 'cliff/clift_left_edge.png');
    
    // Cliff Grounds
    this.load.image('cliff_ground_bottom_left', 'cliff_ground/bottom_left_edge_on_cliff.png');
    this.load.image('cliff_ground_bottom_mid', 'cliff_ground/bottom_mid_edge_on_cliff.png');
    this.load.image('cliff_ground_bottom_right', 'cliff_ground/bottom_right_edge_on_cliff.png');
    this.load.image('cliff_ground_mid_left', 'cliff_ground/mid_left_edge_on_cliff.png');
    this.load.image('cliff_ground_middle', 'cliff_ground/middle_on_cliff.png');
    this.load.image('cliff_ground_mid_right', 'cliff_ground/mid_right_edge_on_cliff.png');
    this.load.image('cliff_ground_top_left', 'cliff_ground/top_left_edge_on_cliff.png');
    this.load.image('cliff_ground_top_mid', 'cliff_ground/top_middle_edge_on_cliff.png');
    this.load.image('cliff_ground_top_right', 'cliff_ground/top_right_edge_on_cliff.png');
    
    // Base Level Data Manifest
    this.load.json('baselevelmanifest', 'baseleveldata/baseleveldatainformation.json');
    
    // HUD buttons
    this.load.image('btn_close', 'other_buttons/close_button.png');
    this.load.image('btn_close_pressed', 'other_buttons/close_button_pressed.png');
    
    // Main Menu buttons
    this.load.image('popup_bg', 'woodentable/woodentable.png');
    this.load.image('menu_btn', 'woodentable/bigBlueButtonUnpressed.png');
    this.load.image('menu_btn_pressed', 'woodentable/bluebuttonPressed.png');
    this.load.image('banner_slots', 'woodentable/Banner_Slots.png');
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
    
    this.load.image('center_btn', 'other_buttons/center_button.png');
    this.load.image('center_btn_pressed', 'other_buttons/center_button_pressed.png');
    
    // Map data
    this.load.tilemapTiledJSON('baselevelnine', 'tiledthings/levels/baselevelnine.json');

    // Landscape tilemap
    this.load.image('landscape_tiles', 'tiledthings/Tilemap_color1.png');
    this.load.image('water_tiles', 'tiledthings/WaterBackground.png');
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.
    this.anims.create({
      key: 'anim_barrel',
      frames: this.anims.generateFrameNumbers('enemy_barrel', { start: 0, end: 23 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'anim_explosion',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 22 }),
      frameRate: 20, // A bit faster for explosion, or use 10? The user said "play them at 10 fps" for the barrel, but didn't specify for explosion.
      repeat: 0 // play once
    });

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start('MainMenu');
  }
}
