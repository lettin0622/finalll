// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let circleX, circleY; // 圓的初始位置
let circleRadius = 50; // 圓的半徑
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

// 畫半透明大字母
function drawLetter(letter) {
  push();
  textAlign(CENTER, CENTER);
  textSize(min(width, height) * 0.6);
  fill(0, 0, 0, 60); // 半透明黑
  noStroke();
  text(letter, width / 2, height / 2 + 30);
  pop();
}

// 換到下一個字母
function nextLetter() {
  currentLetterIndex++;
  if (currentLetterIndex >= letters.length) {
    currentLetterIndex = 0; // 或遊戲結束
  }
  // 設定圓的位置到新字母的第一筆畫起點
  let letter = letters[currentLetterIndex];
  let pt = letterStartPoints[letter];
  circleX = width * pt.x;
  circleY = height * pt.y;
  trails = []; // 清空筆跡
}

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight); // 畫布全螢幕
  video = createCapture(VIDEO, { flipped: true });
  video.size(min(windowWidth, windowHeight) * 0.7, min(windowWidth, windowHeight) * 0.7); // 鏡頭畫面大一點
  video.hide();

  // 設定第一個字母的起點
  let letter = letters[currentLetterIndex];
  let pt = letterStartPoints[letter];
  circleX = width * pt.x;
  circleY = height * pt.y;

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

function draw() {
  background('#edf6f9'); // 設定背景顏色

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

  // 畫半透明字母
  drawLetter(letters[currentLetterIndex]);

  // 畫出所有的軌跡
  for (let trail of trails) {
    stroke(trail.color);
    strokeWeight(20);
    point(trail.x, trail.y);
  }

  // 畫出圓
  fill(0, 0, 255, 150); // 半透明藍色
  noStroke();
  circle(circleX, circleY, circleRadius * 2);

  // 確保至少檢測到一隻手
  if (hands.length > 0) {
    let isHandTouching = false; // 檢查是否有手指夾住圓

    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        // 轉換鏡頭座標到畫布座標
        let indexFinger = hand.keypoints[8];
        let thumb = hand.keypoints[4];
        let ix = map(indexFinger.x, 0, video.width, camX, camX + camSize);
        let iy = map(indexFinger.y, 0, video.height, camY, camY + camSize);
        let tx = map(thumb.x, 0, video.width, camX, camX + camSize);
        let ty = map(thumb.y, 0, video.height, camY, camY + camSize);

        // 檢查食指與大拇指是否同時碰觸圓的邊緣
        let dIndex = dist(ix, iy, circleX, circleY);
        let dThumb = dist(tx, ty, circleX, circleY);

        if (dIndex < circleRadius && dThumb < circleRadius) {
          // 如果兩者同時碰觸到，讓圓跟隨手指移動
          circleX = (ix + tx) / 2;
          circleY = (iy + ty) / 2;

          // 設置軌跡顏色
          if (hand.handedness === "Right") {
            trailColor = color(255, 0, 0); // 紅色
          } else if (hand.handedness === "Left") {
            trailColor = color(0, 255, 0); // 綠色
          }

          isDrawing = true; // 開始畫軌跡
          isHandTouching = true;

          // 儲存當前圓心位置到軌跡
          trails.push({ x: circleX, y: circleY, color: trailColor });
        }
      }
    }

    // 如果沒有手指夾住圓，停止畫軌跡
    if (!isHandTouching) {
      isDrawing = false;
    }
  } else {
    // 如果沒有檢測到手，停止畫軌跡
    isDrawing = false;
  }

  // 檢查是否完成一個字母（例如筆跡長度超過某个值）
  if (trails.length > 80) { // 你可以根據實際情況調整這個數字
    nextLetter();
  }

  // 畫面上方中央加標題（黑字加陰影）
  let title = "淡江大學教育科技系";
  textSize(40);
  textAlign(CENTER, TOP);
  // 陰影
  fill(0, 80);
  text(title, width / 2 + 2, height * 0.08 + 2);
  // 黑字
  fill(0);
  text(title, width / 2, height * 0.08);
}
