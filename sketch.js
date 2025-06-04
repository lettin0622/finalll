let video;
let handpose;
let predictions = [];

let pencilX = 0;
let pencilY = 0;
let trails = [];

let letters = ['T', 'K', 'U', 'E', 'T'];
let currentLetterIndex = 0;
let letterFontSize = 120;
let letterBox = {};
let font;

let gameStarted = false;

function preload() {
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(font);
  textAlign(CENTER, CENTER);

  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  handpose = ml5.handpose(video, () => {
    console.log("模型載入完成");
  });
  handpose.on("predict", (results) => {
    predictions = results;
  });

  initLetter();
}

function initLetter() {
  trails = [];
  pencilX = width / 2;
  pencilY = height / 2 - 60;

  let bounds = font.textBounds(letters[currentLetterIndex], width / 2, height / 2, letterFontSize);
  letterBox = bounds;
}

function draw() {
  background(240);

  // 顯示鏡頭畫面
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  if (!gameStarted) {
    drawStartScreen();
    return;
  }

  // 提示文字
  textSize(28);
  fill(0);
  text("請寫下字母：" + letters.join(', '), width / 2, 40);

  // 畫字母
  fill(0, 50);
  textSize(letterFontSize);
  text(letters[currentLetterIndex], width / 2, height / 2);

  // 畫鉛筆軌跡
  if (trails.length > 1) {
    stroke(0, 150, 255, 180);
    strokeWeight(20);
    noFill();
    beginShape();
    for (let pt of trails) {
      vertex(pt.x, pt.y);
    }
    endShape();
  }

  // 畫鉛筆
  fill(255, 200, 0);
  stroke(100);
  strokeWeight(2);
  ellipse(pencilX, pencilY, 30);

  // 手部偵測與鉛筆控制
  if (predictions.length > 0) {
    let hand = predictions[0];
    let index = hand.annotations.indexFinger[3];
    let ix = width - index[0];
    let iy = index[1];

    fill(255, 0, 0);
    noStroke();
    ellipse(ix, iy, 15); // 手指點

    let d = dist(ix, iy, pencilX, pencilY);
    if (d < 50) {
      pencilX = ix;
      pencilY = iy;

      if (
        pencilX > letterBox.x &&
        pencilX < letterBox.x + letterBox.w &&
        pencilY > letterBox.y &&
        pencilY < letterBox.y + letterBox.h
      ) {
        trails.push({ x: pencilX, y: pencilY });
      }
    }
  }

  // 檢查是否填滿
  if (trails.length > 10) {
    let coverCount = 0;
    let testPoints = 100;
    for (let i = 0; i < testPoints; i++) {
      let tx = letterBox.x + random(letterBox.w);
      let ty = letterBox.y + random(letterBox.h);
      for (let pt of trails) {
        if (dist(tx, ty, pt.x, pt.y) < 20) {
          coverCount++;
          break;
        }
      }
    }

    if (coverCount / testPoints > 0.5) {
      currentLetterIndex++;
      if (currentLetterIndex >= letters.length) {
        noLoop();
        background(255);
        fill(0, 200, 100);
        textSize(60);
        text("恭喜通關！", width / 2, height / 2);
        drawProgress(); // 最後再顯示進度
        return;
      } else {
        initLetter();
      }
    }
  }

  drawProgress();
}

function drawStartScreen() {
  fill(0, 200);
  textSize(36);
  text("請點擊開始遊戲", width / 2, height / 2 - 60);

  fill(0, 120);
  textSize(24);
  text("請寫下字母：T, K, U, E, T", width / 2, height / 2 + 20);

  fill(100, 200, 250);
  noStroke();
  rectMode(CENTER);
  rect(width / 2, height / 2 + 100, 160, 50, 10);

  fill(255);
  textSize(20);
  text("開始遊戲", width / 2, height / 2 + 100);
}

function mousePressed() {
  if (!gameStarted) {
    gameStarted = true;
    loop();
  }
}

function touchStarted() {
  if (!gameStarted) {
    gameStarted = true;
    loop();
  }
}

function drawProgress() {
  let spacing = 24;
  let baseX = 20;
  let baseY = height - 40;

  textSize(28);
  for (let i = 0; i < letters.length; i++) {
    let alpha = i < currentLetterIndex ? 255 : 60;
    fill(0, alpha);
    text(letters[i], baseX + i * spacing, baseY);
  }
}
