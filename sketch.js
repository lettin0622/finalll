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
  video.size( min(windowWidth, windowHeight) * 0.5, min(windowWidth, windowHeight) * 0.5 ); // 設定鏡頭大小為視窗50%，1:1
  video.hide();

  // 圓的初始位置設置在視窗中間
  circleX = width / 2;
  circleY = height / 2;

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

function draw() {
  background('#edf6f9'); // 設定背景顏色

  // 計算鏡頭畫面顯示位置與大小
  let camSize = min(width, height) * 0.5;
  let camX = (width - camSize) / 2;
  let camY = (height - camSize) / 2;

  // 顯示鏡頭畫面（1:1比例，置中）
  image(video, camX, camY, camSize, camSize);

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
        // 獲取食指與大拇指的座標
        let indexFinger = hand.keypoints[8];
        let thumb = hand.keypoints[4];

        // 檢查食指與大拇指是否同時碰觸圓的邊緣
        let dIndex = dist(indexFinger.x, indexFinger.y, circleX, circleY);
        let dThumb = dist(thumb.x, thumb.y, circleX, circleY);

        if (dIndex < circleRadius && dThumb < circleRadius) {
          // 如果兩者同時碰觸到，讓圓跟隨手指移動
          circleX = (indexFinger.x + thumb.x) / 2;
          circleY = (indexFinger.y + thumb.y) / 2;

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
