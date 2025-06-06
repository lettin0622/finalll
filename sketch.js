let video, handpose, hands = [];
let pencilX = 0, pencilY = 0;
let trails = [];
let isDrawing = false;
let currentLetterIndex = 0;
let gameStarted = false;
let canvasSize, camX, camY, camSize;
let font;
let letters = ['T', 'K', 'U', 'E', 'T'];
let letterBox = {}, letterFontSize = 0;
const circleRadius = 50;
const letterStartPoints = {
  'T': { x: 0.5, y: 0.28 },
  'K': { x: 0.42, y: 0.22 },
  'U': { x: 0.42, y: 0.22 },
  'E': { x: 0.42, y: 0.22 }
};

// ...existing code...
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('sans-serif'); // 使用內建字型
  video = createCapture(VIDEO);
  video.size(min(windowWidth, windowHeight) * 0.7, min(windowWidth, windowHeight) * 0.7);
  video.hide();
  video.style('transform', 'scale(-1,1)');
  camSize = min(windowWidth, windowHeight) * 0.7;
  camX = (width - camSize) / 2;
  camY = (height - camSize) / 2;
  handpose = ml5.handpose(video, modelReady);

  let pt = letterStartPoints[letters[0]];
  pencilX = camX + camSize * pt.x;
  pencilY = camY + camSize * pt.y;
}
// ...existing code...

function mousePressed() {
  if (!gameStarted && mouseX > width/2 - 80 && mouseX < width/2 + 80 &&
      mouseY > height/2 - 30 && mouseY < height/2 + 30) {
    gameStarted = true;
    // 遊戲開始時重設鉛筆位置
    let pt = letterStartPoints[letters[currentLetterIndex]];
    pencilX = camX + camSize * pt.x;
    pencilY = camY + camSize * pt.y;
    trails = [];
  }
}

function modelReady() {
  handpose.on("predict", results => hands = results);
}

// 只追蹤左右手食指，並鏡像
function trackIndexFingers() {
  let fingers = [];
  for (let hand of hands) {
    if (hand.keypoints.length > 8) {
      // 鏡像 X 座標
      let ix = map(hand.keypoints[8].x, 0, video.width, camX + camSize, camX);
      let iy = map(hand.keypoints[8].y, 0, video.height, camY, camY + camSize);
      fingers.push({ x: ix, y: iy });
    }
  }
  return fingers;
}

function draw() {
  if (!font || !font.font) return; // 避免 font 尚未載入錯誤
  background('#edf6f9');
  camSize = min(width, height) * 0.7;
  camX = (width - camSize) / 2;
  camY = (height - camSize) / 2;

  fill(0);
  textSize(36);
  textAlign(CENTER, TOP);
  text("淡江大學教育科技系", width / 2, 20);

  stroke(0);
  strokeWeight(2);
  fill(255);
  rect(camX, camY, camSize, camSize, 20);
  image(video, camX, camY, camSize, camSize);

  if (!gameStarted) {
    drawStartButton();
    return;
  }

  let currentLetter = letters[currentLetterIndex];
  drawLetter(currentLetter);
  drawProgress();

  if (trails.length > 1) {
    strokeWeight(letterFontSize * 0.13);
    stroke(0, 150, 255, 180);
    for (let i = 1; i < trails.length; i++) {
      line(trails[i-1].x, trails[i-1].y, trails[i].x, trails[i].y);
    }
  }

  let angle = 0;
  if (trails.length > 1) {
    let prev = trails[trails.length - 2];
    let curr = trails[trails.length - 1];
    angle = atan2(curr.y - prev.y, curr.x - prev.x);
  }
  drawPencil(pencilX, pencilY, angle);

  // 只追蹤左右手食指
  let fingers = trackIndexFingers();
  let isHandTouching = false;
  for (let finger of fingers) {
    if (dist(finger.x, finger.y, pencilX, pencilY) < circleRadius) {
      if (finger.x > letterBox.x && finger.x < letterBox.x + letterBox.w &&
          finger.y > letterBox.y && finger.y < letterBox.y + letterBox.h) {
        pencilX = finger.x;
        pencilY = finger.y;
        isDrawing = true;
        trails.push({ x: pencilX, y: pencilY });
        isHandTouching = true;
      }
    }
  }
  if (!isHandTouching) isDrawing = false;

  if (trails.length > 10) {
    let coverCount = 0;
    for (let i = 0; i < 100; i++) {
      let tx = letterBox.x + random(letterBox.w);
      let ty = letterBox.y + random(letterBox.h);
      for (let j = 0; j < trails.length; j++) {
        if (dist(tx, ty, trails[j].x, trails[j].y) < letterFontSize * 0.07) {
          coverCount++;
          break;
        }
      }
    }
    if (coverCount / 100 > 0.5) {
      currentLetterIndex++;
      if (currentLetterIndex >= letters.length) {
        textSize(40);
        fill(0, 200, 0);
        text("通關成功！", width / 2, height / 2);
        noLoop();
        return;
      }
      let pt = letterStartPoints[letters[currentLetterIndex]];
      pencilX = camX + camSize * pt.x;
      pencilY = camY + camSize * pt.y;
      trails = [];
    }
  }

  fill(50);
  textSize(24);
  textAlign(CENTER, BOTTOM);
  text("請寫出字母 " + currentLetter, width / 2, height - 30);
}

function drawStartButton() {
  fill(255);
  stroke(0);
  rect(width/2 - 80, height/2 - 30, 160, 60, 10);
  fill(0);
  noStroke();
  textSize(28);
  textAlign(CENTER, CENTER);
  text("開始遊戲", width / 2, height / 2);
}

function drawLetter(letter) {
  push();
  textAlign(CENTER, CENTER);
  letterFontSize = camSize * 0.6;
  textSize(letterFontSize);
  fill(0, 0, 0, 40);
  let cx = camX + camSize / 2;
  let cy = camY + camSize / 2 + 30;
  let bbox = font.textBounds(letter, cx, cy, letterFontSize);
  letterBox = {
    x: bbox.x,
    y: bbox.y,
    w: bbox.w,
    h: bbox.h
  };
  text(letter, cx, cy);
  pop();
}

function drawPencil(x, y, angle = 0) {
  push();
  translate(x, y);
  rotate(angle);
  scale(1.8);
  fill(255, 204, 0);
  stroke(150, 100, 0);
  strokeWeight(2);
  rect(-10, -30, 20, 60, 8);
  fill(255, 220, 180);
  triangle(-10, 30, 10, 30, 0, 45);
  fill(80, 60, 40);
  triangle(-4, 40, 4, 40, 0, 45);
  pop();
}

function drawProgress() {
  for (let i = 0; i < letters.length; i++) {
    if (i < currentLetterIndex) {
      fill(0);
    } else {
      fill(0, 100);
    }
    textSize(24);
    textAlign(LEFT, BOTTOM);
    text(letters[i], 20 + i * 26, height - 10);
  }
}
