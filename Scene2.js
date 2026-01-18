class Scene2 {
  constructor(assets) {
    this.assets = assets;

    // ===== 状态 =====
    this.heavenObjects = [];
    this.leftEyeWasClosed = false;
    this.stackHeight = 0;

    // ===== 参数 =====
    this.plungerSize   = 150;
    this.stickyWidth   = 220;
    this.snapThreshold = 10;

    // HeadWindow
    this.headWindow = new Scene2HeadWindow(
      width / 2,
      height / 2,
      140
    );

    for (let i = 0; i < 15; i++) {
      this.createNewObject();
    }
  }

  run(video, faces) {
    imageMode(CORNER);

    if (this.assets.heaven) {
      image(this.assets.heaven, 0, 0, width, height);
    } else {
      background(135, 206, 235);
    }

    this.headWindow.drawVideo(video);

    if (faces.length === 0) return;

    let face = faces[0];
    let nose = face.keypoints[1];

    this.checkBlinkSensitive(face);
    this.checkMouthBlow(face);

    for (let i = this.heavenObjects.length - 1; i >= 0; i--) {
      let o = this.heavenObjects[i];
      o.update(nose.x, nose.y, this);
      o.display();

      if (o.y > height + 100) {
        this.heavenObjects.splice(i, 1);
        this.createNewObject();
      }
    }

    this.drawGlowingPlunger(nose.x, nose.y);
    this.drawBackButton(); 
  }

  drawBackButton() {
    push();
    fill(255, 255, 255, 100); 
    stroke(255);
    strokeWeight(2);
    rectMode(CORNER);
    rect(width - 120, height - 60, 100, 40, 10); 

    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("Back", width - 70, height - 40);
    pop();
  }

  createNewObject() {
    let img = random() > 0.5 ? this.assets.cat : this.assets.cloud;
    this.heavenObjects.push(
      new Scene2HeavenObject(
        random(width),
        random(20, 90),
        img 
      )
    );
  }

  checkBlinkSensitive(face) {
    let rH = dist(face.keypoints[159].x, face.keypoints[159].y,
                  face.keypoints[145].x, face.keypoints[145].y);
    let rW = dist(face.keypoints[33].x, face.keypoints[33].y,
                  face.keypoints[133].x, face.keypoints[133].y);
    let lH = dist(face.keypoints[386].x, face.keypoints[386].y,
                  face.keypoints[374].x, face.keypoints[374].y);
    let lW = dist(face.keypoints[263].x, face.keypoints[263].y,
                  face.keypoints[463].x, face.keypoints[463].y);

    let avgEAR = ((rH / rW) + (lH / lW)) / 2;
    let threshold = 0.23;

    if (avgEAR < threshold && !this.leftEyeWasClosed) {
      this.triggerMultiFall();
      this.leftEyeWasClosed = true;
    }
    if (avgEAR > threshold + 0.05) {
      this.leftEyeWasClosed = false;
    }
  }

  triggerMultiFall() {
    let floating = this.heavenObjects.filter(o => o.state === "FLOATING");
    let count = floor(random(2, 4));
    for (let i = 0; i < count; i++) {
      if (floating.length > 0) {
        let idx = floor(random(floating.length));
        floating[idx].state = "FALLING";
        floating.splice(idx, 1);
      }
    }
  }

  checkMouthBlow(face) {
    let mDist = dist(face.keypoints[13].x, face.keypoints[13].y,
                     face.keypoints[14].x, face.keypoints[14].y);
    if (mDist > 25) {
      this.stackHeight = 0;
      for (let o of this.heavenObjects) {
        if (o.state === "STUCK") {
          o.state = "FALLING";
          o.fallSpeed = 12;
        }
      }
    }
  }

  drawGlowingPlunger(x, y) {
    push();
    translate(x, y);
    rotate(HALF_PI);
    drawingContext.shadowBlur = 60;
    drawingContext.shadowColor = 'rgba(255,215,0,0.9)';
    imageMode(CENTER);
    image(this.assets.plunger, 0, 0, this.plungerSize, this.plungerSize);
    pop();
  }
}

/* ===== Scene2 私有类 ===== */

class Scene2HeavenObject {
  constructor(x, y, img) {
    this.x = x;
    this.y = y;
    this.img = img;
    this.w = random(80, 140);
    this.h = this.w * (img.height / img.width);
    this.state = "FLOATING";
    this.floatSpeed = random(2.0, 3.5);
    this.fallSpeed = random(7, 11);
    this.phase = random(TWO_PI);
    this.stuckOffset = { x: 0, y: 0 };
  }

  update(nx, ny, scene) {
    if (this.state === "FLOATING") {
      this.x += sin(frameCount * 0.02 * this.floatSpeed + this.phase) * 5;
      this.y += cos(frameCount * 0.03 + this.phase) * 0.4;
    }
    else if (this.state === "FALLING") {
      this.y += this.fallSpeed;

      // 定义马桶橛子头部的偏移
      let plungerOffset = 30; 
      
      let horizontalDist = abs(this.x - nx);
      // 判定高度 = 鼻子位置 - 橛子偏移 - 已经堆叠的高度
      let targetY = ny - plungerOffset - scene.stackHeight;
      let verticalDist = abs(this.y - targetY);

      if (
        horizontalDist < scene.stickyWidth / 2 &&
        verticalDist < scene.snapThreshold
      ) {
        this.state = "STUCK";
        
        // 固定在偏移后的位置
        this.y = targetY;

        this.stuckOffset.x = this.x - nx;
        this.stuckOffset.y = this.y - ny;

        // 增加堆叠高度
        scene.stackHeight += this.h * 0.08;
      }
    }
    else if (this.state === "STUCK") {
      this.x = nx + this.stuckOffset.x;
      this.y = ny + this.stuckOffset.y;
    }
  }

  display() {
    push();
    imageMode(CENTER);
    image(this.img, this.x, this.y, this.w, this.h);
    pop();
  }
}

class Scene2HeadWindow {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
  }

  drawVideo(stream) {
    push();
    noFill();
    for (let i = 0; i < 5; i++) {
      let alpha = map(i, 0, 5, 180, 0);
      let weight = map(i, 0, 5, 2, 20);
      stroke(255, 255, 255, alpha);
      strokeWeight(weight);
      ellipse(this.x, this.y, this.r * 2 + i * 1.5);
    }
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.arc(this.x, this.y, this.r, 0, TWO_PI);
    drawingContext.clip();
    translate(width, 0);
    scale(-1, 1);
    image(stream, 0, 0, width, height);
    drawingContext.restore();
    pop();
  }
}