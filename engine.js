const WIDTH = 96;
const HEIGHT = 96 * 2;
const FRAME_CAP = 30;
const TILE_SIZE = 16;

const canvas = document.getElementById("canvas");
canvas.height = HEIGHT;
canvas.width = WIDTH;
resizeCanvas();
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;

ctx.font = `${TILE_SIZE}px sans-serif`;
ctx.textBaseline = "top";

const spriteSheet = document.getElementById("spritesheet");
const font = document.getElementById("font");

const SPRITES = [];
let SOUNDS = [];
const CHARACTERS = {};
let previousTick = 0;
let frameTotal = 0;
const FPS = 1000 / FRAME_CAP;
let lastFrame = 0;

let DEBUG = true;

let cameraOffset = {
  x: 0,
  y: 0,
};

const fps = document.getElementById("fps");
fps.hidden = !DEBUG;

const mouseloc = document.getElementById("mouseloc");
mouseloc.hidden = !DEBUG;

const buttons = {};
const buttonsJustPressed = {};
const buttonHasUpped = {};
let mouseData = { x: 0, y: 0, mouse1: false, xDiff: 0, yDiff: 0 };

function start() {
  if (!spriteSheet.complete || !font.complete) {
    window.requestAnimationFrame(start);
    return;
  }
  for (y = 0; y < spriteSheet.height; y += TILE_SIZE) {
    for (x = 0; x < spriteSheet.width; x += TILE_SIZE) {
      SPRITES.push({ x: x, y: y });
    }
  }
  loadFont();
  loadSounds();

  _init();
  window.requestAnimationFrame(tick);
}

function loadSounds() {
  SOUNDS = document.getElementsByClassName("sound");
}

function tick(delta) {
  frameTotal += delta - previousTick;
  previousTick = delta;
  if (frameTotal < FPS) {
    window.requestAnimationFrame(tick);
    return;
  }
  let fram = 1000 / (delta - lastFrame);
  lastFrame = delta;
  fps.innerHTML = "fps: " + fram;
  mouseloc.innerHTML = "mouse: " + mouseData.x + ", " + mouseData.y;
  frameTotal = Math.min(frameTotal - FPS, FPS);
  _update();
  for (const key in buttonsJustPressed) {
    if (Object.hasOwnProperty.call(buttonsJustPressed, key)) {
      buttonsJustPressed[key] = false;
    }
  }
  _draw();
  window.requestAnimationFrame(tick);
}

function cls() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function spr(i, x, y) {
  let sprite = SPRITES[i];
  ctx.drawImage(
    spriteSheet,
    sprite.x,
    sprite.y,
    TILE_SIZE,
    TILE_SIZE,
    Math.floor(x) - cameraOffset.x,
    Math.floor(y) - cameraOffset.y,
    TILE_SIZE,
    TILE_SIZE
  );
}

function sfx(n) {
  if (n >= SOUNDS.length) {
    console.log("Sound does not exist.");
    return;
  }
  let sound = new Audio(SOUNDS[n].src);
  sound.play();
  sound.addEventListener("ended", (e) => {
    delete e.target;
  });
}

function btn(button) {
  return Boolean(buttons[button.toLowerCase()]);
}

function btnp(button) {
  return Boolean(buttonsJustPressed[button.toLowerCase()]);
}

function camera(x = 0, y = 0) {
  cameraOffset = {
    x: x,
    y: y,
  };
}

function mouse() {
  return {
    x: mouseData.x,
    y: mouseData.y,
    mouse1: mouseData.mouse1,
    xDiff: mouseData.xDiff,
    yDiff: mouseData.yDiff,
  };
}

canvas.addEventListener(
  "keydown",
  (event) => {
    const keyName = event.key.toLowerCase();

    buttons[keyName] = true;
    if (buttonHasUpped[keyName] || buttonHasUpped[keyName] == undefined) {
      buttonsJustPressed[keyName] = true;
      buttonHasUpped[keyName] = false;
    }
  },
  false
);

canvas.addEventListener(
  "keyup",
  (event) => {
    const keyName = event.key.toLowerCase();

    buttons[keyName] = false;
    buttonHasUpped[keyName] = true;
  },
  false
);

canvas.addEventListener(
  "mousedown",
  (event) => {
    mouseData.mouse1 = true;
  },
  false
);

canvas.addEventListener(
  "mouseup",
  (event) => {
    mouseData.mouse1 = false;
  },
  false
);

canvas.addEventListener(
  "touchstart",
  (event) => {
    console.log("touchstart")
    mouseData.mouse1 = true;
  },
  false
);

canvas.addEventListener(
  "touchend",
  (event) => {
    console.log("touchend")
    mouseData.mouse1 = false;
  },
  false
);


document.addEventListener(
  "mousemove",
  (event) => {
    let x = Math.floor(
      (WIDTH / canvas.scrollWidth) * (event.x - canvas.offsetLeft)
    );
    let y = Math.floor(
      (HEIGHT / canvas.scrollHeight) * (event.y - canvas.offsetTop)
    );
    const pos = {
      x: x,
      y: y,
      mouse1: event.buttons % 2 == 1,
      xDiff: x - mouseData.x,
      yDiff: y - mouseData.y,
    };

    mouseData = pos;
  },
  false
);

document.addEventListener(
  "touchmove",
  (event) => {
    console.log("touchmove")
    let x = Math.floor(
      (WIDTH / canvas.scrollWidth) * (event.touches[0].pageX - canvas.offsetLeft)
    );
    let y = Math.floor(
      (HEIGHT / canvas.scrollHeight) * (event.touches[0].pageY - canvas.offsetTop)
    );
    const pos = {
      x: x,
      y: y,
      mouse1: true,
      xDiff: x - mouseData.x,
      yDiff: y - mouseData.y,
    };

    mouseData = pos;
  },
  false
);

document.addEventListener("DOMContentLoaded", start, false);

function resizeCanvas() {
  let windowWidth = document.body.clientWidth;
  let windowHeight = document.body.clientHeight;
  if (windowHeight >= windowWidth) {
    canvas.style.width = windowWidth.toString() + "px";
    canvas.style.height = "";
  } else {
    canvas.style.height = windowHeight.toString() + "px";
    canvas.style.width = "";
  }
}

function rectFill(x0, y0, x1, y1, color) {
  if (color) {
    ctx.fillStyle = color;
  }
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
}

function rect(x, y, xx, yy, color) {
  if (color) {
    ctx.strokeStyle = color;
  }
  let x0, x1, y0, y1;
  if (x <= xx) {
    x0 = x;
    x1 = xx;
  } else {
    x0 = xx;
    x1 = x;
  }

  if (y <= yy) {
    y0 = y;
    y1 = yy;
  } else {
    y0 = yy;
    y1 = y;
  }

  line(x0, y0, x0, y1 - 1);
  line(x0, y0, x1 - 1, y0);
  line(x1 - 1, y0, x1 - 1, y1 - 1);
  line(x0, y1 - 1, x1 - 1, y1 - 1);
}

function line(x0, y0, x1, y1, color) {
  if (color) {
    ctx.strokeStyle = color;
  }

  bresenhamLine(x0, y0, x1, y1);
}

function bresenhamLine(x, y, xx, yy) {
  var oldFill = ctx.fillStyle; // save old fill style
  ctx.fillStyle = ctx.strokeStyle; // move stroke style to fill
  xx = Math.floor(xx);
  yy = Math.floor(yy);
  x = Math.floor(x);
  y = Math.floor(y);
  // BRENSENHAM
  var dx = Math.abs(xx - x);
  var sx = x < xx ? 1 : -1;
  var dy = -Math.abs(yy - y);
  var sy = y < yy ? 1 : -1;
  var err = dx + dy;
  var errC; // error value
  var end = false;
  var x1 = x;
  var y1 = y;

  while (!end) {
    ctx.fillRect(x1, y1, 1, 1); // draw each pixel as a rect
    if (x1 === xx && y1 === yy) {
      end = true;
    } else {
      errC = 2 * err;
      if (errC >= dy) {
        err += dy;
        x1 += sx;
      }
      if (errC <= dx) {
        err += dx;
        y1 += sy;
      }
    }
  }
  ctx.fillStyle = oldFill; // restore old fill style
}

function print(t, x, y, color = "#ffffff", fontSize = 8) {
  let text = "";
  try {
    text = t.toString();
  } catch {
    return;
  }

  let holderCanvas = document.createElement("canvas");
  holderCanvas.height = 8;
  holderCanvas.width = 8;
  let holderCtx = holderCanvas.getContext("2d");
  holderCtx.imageSmoothingEnabled = false;
  holderCtx.mozImageSmoothingEnabled = false;
  holderCtx.webkitImageSmoothingEnabled = false;

  for (let c = 0; c < text.length; ++c) {
    let char = CHARACTERS[text[c]];
    holderCanvas.height = 8;
    holderCanvas.width = 8;
    holderCtx.clearRect(0, 0, 8, 8);
    holderCtx.drawImage(font, char.x, char.y, 8, 8, 0, 0, 8, 8);
    holderCtx.globalCompositeOperation = "source-in";
    holderCtx.fillStyle = color;
    holderCtx.fillRect(0, 0, 8, 8);
    // holderCanvas.height = fontSize;
    // holderCanvas.width = fontSize;
    ctx.drawImage(
      holderCanvas,
      0,
      0,
      8,
      8,
      Math.floor(x) - cameraOffset.x + c * fontSize,
      Math.floor(y) - cameraOffset.y,
      fontSize,
      fontSize
    );
  }
  // ctx.fillText(text, x, y);
}

function loadFont() {
  let chars =
    " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz♪~●►";

  for (y = 0; y < font.height; y += 8) {
    for (x = 0; x < font.width; x += 8) {
      let curChar = chars[0];
      chars = chars.substring(1);
      CHARACTERS[curChar] = { x: x, y: y };
    }
  }
}

window.onresize = resizeCanvas;
