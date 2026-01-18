class Scene1 {
  constructor(assets, onFlush) {
    this.assets = assets;
    this.onFlush = onFlush;

    this.headWindow = new HeadWindow(width / 2 - 10, height * 0.24, 100);
    this.waterSystem = new WaterSystem(30, 140, 22, 200);
    this.items = [];
    
  }
  reset() {
  if(this.waterSystem) {
    this.waterSystem.level = 0;
  }
  this.items = [];
}

  run(video, faces) {
    image(this.assets.bg1, 0, 0, width, height);

    if (video.elt.readyState === video.elt.HAVE_ENOUGH_DATA) {
      this.headWindow.display(video, this.assets.hair);
    }

    this.handleMouth(faces);

    for (let i = this.items.length - 1; i >= 0; i--) {
      this.items[i].update();
      this.items[i].display();
    }

    this.waterSystem.display();

    if (this.waterSystem.isFull()) this.checkFlush();
  }

  handleMouth(faces) {
    if (faces.length === 0 || this.waterSystem.isFull()) return;
    let f = faces[0];
    let up = f.keypoints[13];
    let low = f.keypoints[14];
    if (!up || !low) return;

    let d = dist(up.x, up.y, low.x, low.y);
    let mx = (up.x + low.x) / 2;
    let my = (up.y + low.y) / 2;

    if (
      d > 18 &&
      dist(mx, my, this.headWindow.x, this.headWindow.y) < this.headWindow.r &&
      frameCount % 8 === 0
    ) {
      let img = random([
        this.assets.toilet,
        this.assets.cow,
        this.assets.gun,
        this.assets.shit,
        this.assets.pizza
      ]);
      this.items.push(new FallingItem(mx, my, img));
      this.waterSystem.increase(4);
    }
  }

  checkFlush() {
    let bx = width - 150, by = height - 80, bw = 120, bh = 45;

    if (
      mouseIsPressed &&
      mouseX > bx && mouseX < bx + bw &&
      mouseY > by && mouseY < by + bh
    ) {
      this.onFlush();
    }
  }
}

/* ===== Scene1 私有类 ===== */

class HeadWindow {
  constructor(x, y, r) { this.x = x; this.y = y; this.r = r; }

  display(video, hair) {
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.arc(this.x, this.y, this.r, 0, TWO_PI);
    drawingContext.clip();

    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();

    drawingContext.restore();

    if (hair) {
      imageMode(CENTER);
      image(hair, this.x, this.y - this.r * 0.5, this.r * 4, this.r * 4);
    }
  }
}

class FallingItem {
  constructor(x, y, img) {
    this.x = x;
    this.y = y;
    this.img = img;
    this.tx = random(40, width - 40);
    this.vy = random(-12, -8);
    this.g = 0.9;
    this.rot = random(-0.06, 0.06);
    this.angle = random(TWO_PI);
    this.size = random(70, 130);
    this.landed = false;
  }

  update() {
    if (!this.landed) {
      this.vy += this.g;
      this.x = lerp(this.x, this.tx, 0.03);
      this.y += this.vy;
      this.angle += this.rot;
      if (this.y > height * 0.9) this.landed = true;
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    imageMode(CENTER);
    image(this.img, 0, 0, this.size, this.size);
    pop();
  }
}

class WaterSystem {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.level = 0;
  }

  increase(v) { this.level = min(this.level + v, 100); }
  isFull() { return this.level >= 100; }

  display() {
    fill(220);
    rect(this.x, this.y, this.w, this.h, 10);
    let hh = map(this.level, 0, 100, 0, this.h);
    fill(0, 150, 255);
    rect(this.x, this.y + this.h - hh, this.w, hh, 10);

    if (this.isFull()) {
      fill(255, 220, 0);
      rect(width - 150, height - 80, 120, 45, 12);
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(18);
      text("冲水", width - 90, height - 58);
    }
  }
}
