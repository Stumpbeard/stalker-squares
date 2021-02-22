const WIDTH = 96;
const HEIGHT = 80 * 2;
const FRAME_CAP = 30;
const TILE_SIZE = 16;

const canvas = document.getElementById("canvas");
canvas.height = HEIGHT;
canvas.width = WIDTH;
resizeCanvas();
const ctx = canvas.getContext("2d");

ctx.font = `${TILE_SIZE}px sans-serif`;
ctx.textBaseline = "top";

const spriteSheet = document.getElementById("spritesheet");
const SPRITES = [];
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
  if (!spriteSheet.complete) {
    window.requestAnimationFrame(start);
    return;
  }
  for (y = 0; y < spriteSheet.height; y += TILE_SIZE) {
    for (x = 0; x < spriteSheet.width; x += TILE_SIZE) {
      SPRITES.push({ x: x, y: y });
    }
  }

  _init();
  window.requestAnimationFrame(tick);
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
  "mousemove",
  (event) => {
    let x = Math.floor(
      (WIDTH / event.target.scrollWidth) * (event.x - event.target.offsetLeft)
    );
    let y = Math.floor(
      (HEIGHT / event.target.scrollHeight) * (event.y - event.target.offsetTop)
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

function rect(x0, y0, x1, y1, color) {
  ctx.translate(0.5, 0.5);

  if (color) {
    ctx.strokeStyle = color;
  }
  ctx.strokeRect(x0, y0, x1 - x0 - 1, y1 - y0 - 1);

  ctx.translate(-0.5, -0.5);
}

function print(text, x, y, color) {
  if (color) {
    ctx.fillStyle = color;
  }
  ctx.fillText(text, x, y);
}

window.onresize = resizeCanvas;
