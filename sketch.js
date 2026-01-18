let faceMesh;
let options = { maxFaces: 1, refineLandmarks: true, flipped: true };
let faces = [];
let video;

let assets = {};
let bgm1, bgm2, soundFlush;

let scene1, scene2;
let currentScene = "SCENE1";

let isTransitioning = false;
let transitionT = 0;

// ✅ 新增：标记游戏是否开始
let gameStarted = false; 

function preload() {
  faceMesh = ml5.faceMesh(options);
  // ... 图片资源加载保持不变 ...
  assets.bg1     = loadImage("assets/background.jpg");
  assets.toilet  = loadImage("assets/toilet.png");
  assets.cow     = loadImage("assets/cow.png");
  assets.gun     = loadImage("assets/juezi.png");
  assets.shit    = loadImage("assets/shit.png");
  assets.pizza   = loadImage("assets/pizza.png");
  assets.hair    = loadImage("assets/hair.png");
  assets.cloud   = loadImage("assets/cloud.png");
  assets.cat     = loadImage("assets/cat.png");
  assets.plunger = loadImage("assets/plunger.png");
  assets.heaven  = loadImage("assets/heaven.jpg");

  // 音频资源
  bgm1 = loadSound('scene1music.mp3');
  bgm2 = loadSound('scene2music.mp3');
  soundFlush = loadSound('flushing.mp3');
}

function setup() {
  createCanvas(640, 480);

  video = createCapture(VIDEO, () => {
    console.log("摄像头已就绪");
    faceMesh.detectStart(video, r => faces = r);
  });
  video.size(640, 480);
  video.hide();

  scene1 = new Scene1(assets, startTransition);
  scene2 = new Scene2(assets);
}

function draw() {
  // ✅ 如果还没点击开始，显示启动画面
  if (!gameStarted) {
    background(255);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("点击屏幕开启进入", width / 2, height / 2);
    textSize(16);
    text("(请确保已允许摄像头权限)", width / 2, height / 2 + 40);
    return; // 不执行下面的逻辑
  }

  background(0);
  push();

  if (isTransitioning) {
    transitionT += 0.04;
    let t = easeInOut(transitionT);
    translate(width / 2, height / 2);
    rotate(t * PI);
    scale(1 - t);
    translate(-width / 2, -height / 2);
    scene1.run(video, faces);

    if (transitionT >= 1) {
      isTransitioning = false;
      currentScene = "SCENE2";
      if (!bgm2.isPlaying()) bgm2.loop();
    }
  } 
  else if (currentScene === "SCENE1") {
    scene1.run(video, faces);
  } 
  else {
    scene2.run(video, faces);
  }
  pop();
}

function mouseClicked() {
  // ✅ 第一次点击：激活音频并开始游戏
  if (!gameStarted) {
    userStartAudio(); // p5.js 提供的激活音频函数
    bgm1.loop();
    gameStarted = true;
    return;
  }

  // --- 原有的交互逻辑 ---
  if (currentScene === "SCENE2" && !isTransitioning) {
    if (mouseX > width - 120 && mouseX < width - 20 && 
        mouseY > height - 60 && mouseY < height - 20) {
      if (bgm2.isPlaying()) bgm2.stop();
      if (!bgm1.isPlaying()) bgm1.loop();
      currentScene = "SCENE1";
      if (scene1) scene1.reset();
      scene2.stackHeight = 0;
      scene2.heavenObjects = [];
      for(let i=0; i<15; i++) scene2.createNewObject();
    }
  }

  if (currentScene === "SCENE1") {
    if (scene1 && scene1.waterSystem && scene1.waterSystem.isFull()) {
      if (mouseX > width - 150 && mouseY > height - 80) {
        startTransition();
      }
    }
  }
}

function startTransition() {
  if (isTransitioning) return;
  isTransitioning = true;
  transitionT = 0;
  if (bgm1.isPlaying()) bgm1.stop();
  soundFlush.play();
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2;
}