// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let circleX, circleY; // 鉛筆的初始位置
let circleRadius = 50; // 鉛筆碰觸判斷半徑
let isDrawing = false; // 是否正在畫軌跡
let trailColor; // 軌跡顏色
let trails = []; // 用於儲存所有的軌跡

// 字母練習相關
let letters = ['T', 'K', 'U', 'E', 'T'];
let currentLetterIndex = 0;
// 每個字母的第一筆畫起點（以畫布比例設定，方便自適應）
const letterStartPoints = {
  'T': { x: 0.5, y: 0.28 },
  'K': { x: 0.42, y: 0.22 },
  'U': { x: 0.42, y: 0.22 },
  'E': { x: 0.42, y: 0.22 }
};

// 字母顯示與作畫區設定
let letterBox = {}; // {x, y, w, h}
let letterFontSize = 0;

function drawLetter(letter) {
  push();
  textAlign(CENTER, CENTER);
  letterFontSize = min(width, height) * 0.6;
  textSize(letterFontSize);
  fill(0, 0, 0, 60); // 半透明黑
  noStroke();
  // 計算字母邊框
  let bbox = font.textBounds(letter, width / 2, height / 2 + 30, letterFontSize);
  letterBox = {
    x: bbox.x,
    y: bbox.y,
    w: bbox.w,
    h: bbox.h
  };
  text(letter, width / 2, height / 2 + 30);
  pop();
  // 畫字母邊框（可視化用，正式可註解）
  // push();
  // noFill();
  // stroke(0, 100, 255, 80);
  // strokeWeight(2);
  // rect(letterBox.x, letterBox.y, letterBox.w, letterBox.h);
  // pop();
}

// 畫鉛筆
function drawPencil(x, y, angle = 0) {
  push();
  translate(x, y);
  rotate(angle);
  // 筆身
  fill(255, 204, 0);
  stroke(150, 100, 0);
  strokeWeight(2);
  rect(-10, -30, 20, 60, 8);
  // 筆頭
  fill(255, 220, 180);
  triangle(-10, 30, 10, 30, 0, 45);
  // 筆芯
  fill(80, 60, 40);
  triangle(-4, 40, 4, 40, 0, 45);
  pop();
}

// 換到下一個字母
function nextLetter() {
  currentLetterIndex++;
  if (currentLetterIndex >= letters.length) {
    currentLetterIndex = 0; // 或遊戲結束
  }
  // 設定鉛筆的位置到新字母的第一筆畫起點
  let letter = letters[currentLetterIndex];
  let pt = letterStartPoints[letter];
  circleX = width * pt.x;
  circleY = height * pt.y;
  trails = []; // 清空筆跡
}

let font;
function preload() {
  // 載入字型以取得 textBounds
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf');
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(font);
  video = createCapture(VIDEO, { flipped: true });
  video.size(min(windowWidth, windowHeight) * 0.7, min(windowWidth, windowHeight) * 0.7);
  video.hide();

  // 設定第一個字母的起點
  let letter = letters[currentLetterIndex];
  let pt = letterStartPoints[letter];
  circleX = width * pt.x;
  circleY = height * pt.y;

  handPose.detectStart(video, gotHands);
}

function draw() {
  background('#edf6f9');

  // 鏡頭畫面比例
  let camSize = min(width, height) * 0.7;
  let camX = (width - camSize) / 2;
  let camY = (height - camSize) / 2;

  // 畫白底黑邊框
  stroke(0);
  strokeWeight(3);
  fill(255);
  rect(camX, camY, camSize, camSize, 20);

  // 顯示鏡頭畫面（1:1比例，置中）
  image(video, camX, camY, camSize, camSize);

  // 畫半透明字母並取得 letterBox
  drawLetter(letters[currentLetterIndex]);

  // 畫出所有的軌跡（比字母粗一點）
  if (trails.length > 1) {
    strokeWeight(letterFontSize * 0.13); // 字母約0.6畫布，筆跡約0.13畫布
    stroke(0, 150, 255, 180);
    for (let i = 1; i < trails.length; i++) {
      line(trails[i - 1].x, trails[i - 1].y, trails[i].x, trails[i].y);
    }
  }

  // 畫鉛筆（朝向移動方向）
  let angle = 0;
  if (trails.length > 1) {
    let prev = trails[trails.length - 2];
    let curr = trails[trails.length - 1];
    angle = atan2(curr.y - prev.y, curr.x - prev.x);
  }
  drawPencil(circleX, circleY, angle);

  // 手勢偵測與鉛筆移動
  if (hands.length > 0) {
    let isHandTouching = false;
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        let indexFinger = hand.keypoints[8];
        let thumb = hand.keypoints[4];
        let ix = map(indexFinger.x, 0, video.width, camX, camX + camSize);
        let iy = map(indexFinger.y, 0, video.height, camY, camY + camSize);
        let tx = map(thumb.x, 0, video.width, camX, camX + camSize);
        let ty = map(thumb.y, 0, video.height, camY, camY + camSize);

        let dIndex = dist(ix, iy, circleX, circleY);
        let dThumb = dist(tx, ty, circleX, circleY);

        if (dIndex < circleRadius && dThumb < circleRadius) {
          // 計算新位置
          let newX = (ix + tx) / 2;
          let newY = (iy + ty) / 2;
          // 限制只能在字母邊框內
          if (
            newX > letterBox.x &&
            newX < letterBox.x + letterBox.w &&
            newY > letterBox.y &&
            newY < letterBox.y + letterBox.h
          ) {
            circleX = newX;
            circleY = newY;

            // 設置軌跡顏色
            if (hand.handedness === "Right") {
              trailColor = color(255, 0, 0);
            } else if (hand.handedness === "Left") {
              trailColor = color(0, 255, 0);
            } else {
              trailColor = color(0, 150, 255);
            }

            isDrawing = true;
            isHandTouching = true;

            // 只記錄在字母框內的筆跡
            trails.push({ x: circleX, y: circleY, color: trailColor });
          }
        }
      }
    }
    if (!isHandTouching) isDrawing = false;
  } else {
    isDrawing = false;
  }

  // 判斷是否填滿字母（簡單判斷：筆跡點覆蓋率超過某比例）
  if (trails.length > 10) {
    let coverCount = 0;
    let totalTest = 100;
    for (let i = 0; i < totalTest; i++) {
      let tx = letterBox.x + (letterBox.w * Math.random());
      let ty = letterBox.y + (letterBox.h * Math.random());
      // 判斷這個點是否有被筆跡覆蓋
      for (let j = 0; j < trails.length; j++) {
        let d = dist(tx, ty, trails[j].x, trails[j].y);
        if (d < letterFontSize * 0.07) { // 筆跡半徑
          coverCount++;
          break;
        }
      }
    }
    if (coverCount / totalTest > 0.55) { // 覆蓋率超過55%就換字母
      nextLetter();
    }
  }

  // 畫面上方中央加標題（黑字加陰影）
  let title = "淡江大學教育科技系";
  textSize(40);
  textAlign(CENTER, TOP);
  fill(0, 80);
  text(title, width / 2 + 2, height * 0.08 + 2);
  fill(0);
  text(title, width / 2, height * 0.08);
}
