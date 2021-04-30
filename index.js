const Colors = {
  darkRed: "#ac3232",
  lightRed: "#d95763",
  lightGray: "#847e87",
  white: "#ffffff",
  lightGreen: "#99e550",
  darkGreen: "#6abe30",
};

function _init() {
  inputTimer = 30;
  if (window.localStorage.getItem("banditsOn")) {
    banditsOn = window.localStorage.getItem("banditsOn") === "true";
  } else {
    banditsOn = true;
  }
  States = {
    inited: false,
    playerControl: false,
    pieceHeld: false,
    loweringCurrentPieces: false,
    spawningNewPieces: false,
    levelWon: false,
    levelLost: false,
    levelLostShot: false,
    tutorialScreen: true,
    gameScreen: false,
    levelUpScreen: false,
    levelUpChosen: false,
    firstSwap: false,
    banditsOn: banditsOn,
  };
  highScore = undefined;
  if (localStorage.getItem("highScore")) {
    highScore = Number(localStorage.getItem("highScore"));
  }
  deathShot = undefined;
  tutorialMan = {
    x: TILE_SIZE * 3,
    y: 0,
    spd: 1,
  };
  tutorialPiece1 = {
    x: TILE_SIZE * 4,
    y: 0,
  };
  tutorialPiece2 = {
    x: TILE_SIZE * 5,
    y: 0,
  };
  bunkerSpawnScore = 0;
  totalScore = 0;
  bunkerSpawnTarget = 1000;
  pieceHoldLimit = 4;
  blowoutCounter = 20;
  banditMod = 0;
  bunkerMod = 0;
  blowoutMod = 0;
  wallPieces = 0;
  board = newBoard(0, TILE_SIZE * 7);
  heldPiece = {
    piece: undefined,
    lastX: 0,
    lastY: 0,
    origX: 0,
    origY: 0,
    timer: pieceHoldLimit * FRAME_CAP,
    firstSwitch: false,
    pieceDropped: false,
  };
  verifyBoard(board);
  States.inited = true;
  States.playerControl = true;
  scoreFloaties = [];
  playerStrobe = 0;
  blowoutWidth = -2;
  playerIcon = undefined;
  banditToggleCooldown = 0;
}

function _update() {
  if (States.tutorialScreen) {
    updateTutorial();
  } else if (States.gameScreen) {
    updateGame();
  } else if (States.levelUpScreen) {
    updateLevelUp();
  }
}

function _draw() {
  cls();
  if (States.tutorialScreen) {
    drawTutorial();
  } else if (States.gameScreen) {
    drawGame();
  } else if (States.levelUpScreen) {
    drawLevelUp();
  }
}

function newPiece(x, y) {
  return {
    x: x,
    targetX: x,
    y: y,
    targetY: y,
    color: Math.floor(Math.random() * 6) + 1,
    fresh: true,
  };
}

function drawPiece(piece) {
  if (!heldPiece.piece && States.playerControl && piece.color === 0) {
    switch (Math.floor(playerStrobe) % 5) {
      case 0:
        spr(9, piece.x, piece.y);
        break;
      case 1:
        spr(10, piece.x, piece.y);
        break;
      case 2:
        spr(11, piece.x, piece.y);
        break;
      case 3:
        spr(10, piece.x, piece.y);
      default:
        spr(9, piece.x, piece.y);
        break;
    }
  } else {
    spr(piece.color, piece.x, piece.y);
  }
}

function newBoard(x, y) {
  let pieces = [];
  for (let y = 0; y < 5; ++y) {
    let row = [];
    for (let x = 0; x < 6; ++x) {
      let piece = newPiece(x * TILE_SIZE, y * TILE_SIZE);
      row.push(piece);
    }
    pieces.push(row);
  }
  let stalkerX = Math.floor(Math.random() * pieces[0].length);
  let stalkerY = Math.floor(Math.random() * pieces.length);
  pieces[stalkerY][stalkerX].color = 0;
  return {
    x: x,
    y: y,
    pieces: pieces,
    marked: false,
  };
}

function drawBoard(board) {
  for (let y = 0; y < board.pieces.length; ++y) {
    let row = board.pieces[y];
    for (let x = 0; x < row.length; ++x) {
      let piece = row[x];
      if (piece) {
        drawPiece({
          x: board.x + piece.x,
          y: board.y + piece.y,
          color: piece.color,
        });
      }
    }
  }
}

function verifyBoard(board) {
  let movedPieces = true;
  while (movedPieces) {
    movedPieces = false;
    for (let y = 0; y < board.pieces.length; ++y) {
      let row = board.pieces[y];
      let prevColor = undefined;
      let curColor = undefined;
      let consecutive = 0;
      for (let x = 0; x < row.length; ++x) {
        let piece = row[x];
        curColor = piece.color;
        if (prevColor === curColor) {
          consecutive += 1;
          if (consecutive >= 3) {
            piece.color = Math.max((piece.color + 1) % 7, 1);
            movedPieces = true;
            consecutive = 1;
            curColor = piece.color;
          }
        } else {
          consecutive = 1;
        }
        prevColor = curColor;
      }
    }

    for (let x = 0; x < board.pieces[0].length; ++x) {
      let prevColor = undefined;
      let curColor = undefined;
      let consecutive = 0;
      for (let y = 0; y < board.pieces.length; ++y) {
        let piece = board.pieces[y][x];
        curColor = piece.color;
        if (prevColor === curColor) {
          consecutive += 1;
          if (consecutive >= 3) {
            piece.color = Math.max((piece.color + 1) % 7, 1);
            movedPieces = true;
            consecutive = 1;
            curColor = piece.color;
          }
        } else {
          consecutive = 1;
        }
        prevColor = curColor;
      }
    }
  }
}

function piecesColliding(piece1, piece2) {
  return piece1 !== piece2;
}

function swapPieces(swapPiece, x, y) {
  board.pieces[heldPiece.origY][heldPiece.origX] = swapPiece;
  if (swapPiece) {
    swapPiece.x = heldPiece.origX * TILE_SIZE;
    swapPiece.targetX = swapPiece.x;
    swapPiece.y = heldPiece.origY * TILE_SIZE;
    swapPiece.targetY = swapPiece.y;
  }
  board.pieces[y][x] = heldPiece.piece;
  heldPiece.origX = x;
  heldPiece.origY = y;
}

function markMatchingPieces() {
  let combos = [];

  // rows
  for (let y = 0; y < board.pieces.length; ++y) {
    let row = board.pieces[y];
    let curColor = undefined;
    let comboCount = 0;
    for (let x = 0; x < row.length; ++x) {
      let piece = row[x];
      if (piece && piece.color !== 7 && piece.color === curColor) {
        comboCount += 1;
      } else {
        if (comboCount >= 3) {
          let combo = [];
          for (let j = x - 1; j >= x - comboCount; --j) {
            board.pieces[y][j].marked = true;
            combo.push(board.pieces[y][j]);
          }
          combos.push(combo);
        }
        if (piece) {
          curColor = piece.color;
        } else {
          curColor = undefined;
        }
        comboCount = 1;
      }
    }
    if (comboCount >= 3) {
      let combo = [];
      for (let j = row.length - 1; j >= row.length - comboCount; --j) {
        board.pieces[y][j].marked = true;
        combo.push(board.pieces[y][j]);
      }
      combos.push(combo);
    }
  }

  // columns
  for (let x = 0; x < board.pieces[0].length; ++x) {
    let curColor = undefined;
    let comboCount = 0;
    for (let y = 0; y < board.pieces.length; ++y) {
      let piece = board.pieces[y][x];
      if (piece && piece.color !== 7 && piece.color === curColor) {
        comboCount += 1;
      } else {
        if (comboCount >= 3) {
          let combo = [];
          for (let j = y - 1; j >= y - comboCount; --j) {
            board.pieces[j][x].marked = true;
            combo.push(board.pieces[j][x]);
          }
          combos.push(combo);
        }
        if (piece) {
          curColor = piece.color;
        } else {
          curColor = undefined;
        }
        comboCount = 1;
      }
    }
    if (comboCount >= 3) {
      let combo = [];
      for (
        let j = board.pieces.length - 1;
        j >= board.pieces.length - comboCount;
        --j
      ) {
        board.pieces[j][x].marked = true;
        combo.push(board.pieces[j][x]);
      }
      combos.push(combo);
    }
  }

  let foundMerge = true;
  while (foundMerge) {
    foundMerge = false;
    for (let i = 0; i < combos.length; ++i) {
      let curCombo = combos[i];
      for (let j = i + 1; j < combos.length; ++j) {
        let nextCombo = combos[j];
        let checker = {};
        for (let y = 0; y < curCombo.length; ++y) {
          checker[JSON.stringify(curCombo[y])] = true;
        }
        let merged = false;
        for (let z = 0; z < curCombo.length; ++z) {
          if (checker[JSON.stringify(nextCombo[z])]) {
            combos[i] = new Set(curCombo.concat(nextCombo));
            combos[i] = [...combos[i]];
            combos.splice(j);
            merged = true;
            foundMerge = true;
          }
        }
        if (merged) {
          break;
        }
      }
    }
  }
  return combos;
}

function replacePieces() {
  let replacedPieces = [];
  for (let y = 0; y < board.pieces.length; ++y) {
    let row = board.pieces[y];
    for (let x = 0; x < row.length; ++x) {
      let piece = row[x];
      if (!piece) {
        let createdPiece = newPiece(x * TILE_SIZE, y * TILE_SIZE);
        createdPiece.y -= HEIGHT / 2;
        tryForBandit(createdPiece);
        replacedPieces.push([x, y, createdPiece]);
      }
    }
  }

  let newWalls = Math.floor(bunkerSpawnScore / (bunkerSpawnTarget + bunkerMod));
  bunkerSpawnScore = bunkerSpawnScore % (bunkerSpawnTarget + bunkerMod);

  if (newWalls > 0) {
    sfx(3);
  }

  while (newWalls > 0) {
    let roll = Math.floor(Math.random() * replacedPieces.length);
    let piece = replacedPieces[roll][2];
    if (piece.color !== 7) {
      piece.color = 7;
      newWalls -= 1;
      wallPieces += 1;
    }
  }

  for (let i = 0; i < replacedPieces.length; ++i) {
    let p = replacedPieces[i];
    board.pieces[p[1]][p[0]] = p[2];
  }
}

function movePiecesTowardsTarget() {
  let movedPieces = false;
  for (let y = 0; y < board.pieces.length; ++y) {
    let row = board.pieces[y];
    for (let x = 0; x < row.length; ++x) {
      let piece = row[x];
      if (piece && piece.y < piece.targetY) {
        piece.y += 4;
        movedPieces = true;
      }
    }
  }

  return movedPieces;
}

function removeComboPieces(combos) {
  for (let i = 0; i < combos.length; ++i) {
    let curCombo = combos[i];
    let perPieceBonus = (curCombo.length - 2) * 100;
    for (let j = 0; j < curCombo.length; ++j) {
      let piece = curCombo[j];
      let xCoord = Math.floor(piece.x / TILE_SIZE);
      let yCoord = Math.floor(piece.y / TILE_SIZE);
      board.pieces[yCoord][xCoord] = undefined;
      bunkerSpawnScore += perPieceBonus;
      totalScore += perPieceBonus;
      scoreFloaties.push(
        newScoreFloaty(piece.x + board.x, piece.y + board.y, perPieceBonus)
      );
    }
  }
}

function lowerCurrentPieces() {
  let loweredPiece = false;
  for (let y = board.pieces.length - 2; y >= 0; --y) {
    let row = board.pieces[y];
    for (let x = 0; x < row.length; ++x) {
      let piece = row[x];
      if (y + 1 < board.pieces.length && board.pieces[y + 1][x] === undefined) {
        board.pieces[y + 1][x] = piece;
        if (board.pieces[y + 1][x] !== undefined) {
          piece.targetY += TILE_SIZE;
          loweredPiece = true;
        }
        board.pieces[y][x] = undefined;
      }
    }
  }

  return loweredPiece;
}

function drawBunkerBar(x, y) {
  rect(x, y, x + 96, y + 16, Colors.lightGray);
  rectFill(
    x + 1,
    y + 1,
    x +
      1 +
      Math.floor(
        ((95 - 1) / (bunkerSpawnTarget + bunkerMod)) * bunkerSpawnScore
      ),
    y + 16 - 1,
    Colors.darkGreen
  );
  print(
    `${bunkerSpawnScore / 10} / ${(bunkerSpawnTarget + bunkerMod) / 10}`,
    x + 4,
    y + 4,
    Colors.white
  );
}

function drawHoldTimer() {
  if (heldPiece.piece && heldPiece.firstSwitch) {
    rect(
      heldPiece.piece.x + board.x,
      heldPiece.piece.y + TILE_SIZE + board.y,
      heldPiece.piece.x +
        Math.floor(
          (TILE_SIZE / (pieceHoldLimit * FRAME_CAP)) * heldPiece.timer
        ) +
        board.x,
      heldPiece.piece.y + TILE_SIZE + board.y,
      Colors.darkGreen
    );
  }
}

function winStateExists() {
  for (let y = 0; y < board.pieces.length - 2; ++y) {
    let row = board.pieces[y];
    for (let x = 0; x < row.length - 2; ++x) {
      let piece = row[x];
      if (piece && piece.color === 7) {
        if (
          board.pieces[y][x + 1].color === 7 &&
          board.pieces[y][x + 2].color === 7 &&
          board.pieces[y + 1][x].color === 7 &&
          board.pieces[y + 1][x + 1].color === 0 &&
          board.pieces[y + 1][x + 2].color === 7 &&
          board.pieces[y + 2][x].color === 7 &&
          board.pieces[y + 2][x + 1].color === 7 &&
          board.pieces[y + 2][x + 2].color === 7
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

function tryForBandit(piece) {
  if (!States.banditsOn) {
    return;
  }
  const chance = 16 - wallPieces - banditMod;
  const roll = Math.floor(Math.random() * chance);
  if (roll <= 0) {
    piece.color = 8;
    sfx(4);
  }
}

function checkBanditShots() {
  for (let y = 0; y < board.pieces.length; ++y) {
    let row = board.pieces[y];
    for (let x = 0; x < row.length; ++x) {
      let piece = row[x];
      if (piece && piece.color === 8 && !piece.fresh) {
        for (let i = y; i >= 0; --i) {
          let target = board.pieces[i][x];
          if (
            target !== piece &&
            target &&
            (target.color === 7 || target.color === 8)
          ) {
            break;
          } else if (target && target.color === 0) {
            deathShot = [
              { x: piece.x + TILE_SIZE / 2, y: piece.y + TILE_SIZE / 2 },
              { x: target.x + TILE_SIZE / 2, y: target.y + TILE_SIZE / 2 },
            ];
            return true;
          }
        }
        for (let i = y; i < board.pieces.length; ++i) {
          let target = board.pieces[i][x];
          if (
            target !== piece &&
            target &&
            (target.color === 7 || target.color === 8)
          ) {
            break;
          } else if (target && target.color === 0) {
            deathShot = [
              { x: piece.x + TILE_SIZE / 2, y: piece.y + TILE_SIZE / 2 },
              { x: target.x + TILE_SIZE / 2, y: target.y + TILE_SIZE / 2 },
            ];
            return true;
          }
        }
        for (let i = x; i >= 0; --i) {
          let target = board.pieces[y][i];
          if (
            target !== piece &&
            target &&
            (target.color === 7 || target.color === 8)
          ) {
            break;
          } else if (target && target.color === 0) {
            deathShot = [
              { x: piece.x + TILE_SIZE / 2, y: piece.y + TILE_SIZE / 2 },
              { x: target.x + TILE_SIZE / 2, y: target.y + TILE_SIZE / 2 },
            ];
            return true;
          }
        }
        for (let i = x; i < board.pieces[y].length; ++i) {
          let target = board.pieces[y][i];
          if (
            target !== piece &&
            target &&
            (target.color === 7 || target.color === 8)
          ) {
            break;
          } else if (target && target.color === 0) {
            deathShot = [
              { x: piece.x + TILE_SIZE / 2, y: piece.y + TILE_SIZE / 2 },
              { x: target.x + TILE_SIZE / 2, y: target.y + TILE_SIZE / 2 },
            ];
            return true;
          }
        }
      }
    }
  }
}

function isColliding(one, two) {
  let rect1 = { x: one.x, y: one.y, width: one.w, height: one.h };
  let rect2 = { x: two.x, y: two.y, width: two.w, height: two.h };

  if (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width >= rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height >= rect2.y
  ) {
    return true;
  }

  return false;
}

function arePiecesColliding(piece1, piece2) {
  let one = {
    x: piece1.x + TILE_SIZE / 4,
    y: piece1.y + TILE_SIZE / 4,
    w: TILE_SIZE / 2,
    h: TILE_SIZE / 2,
  };

  let two = {
    x: piece2.x + TILE_SIZE / 4,
    y: piece2.y + TILE_SIZE / 4,
    w: TILE_SIZE / 2,
    h: TILE_SIZE / 2,
  };

  return isColliding(one, two);
}

function updateGame() {
  let m = mouse();

  if (banditToggleCooldown > 0) {
    banditToggleCooldown -= 1;
  }
  if ((States.levelLost || States.levelLostShot) && m.mouse1) {
    if (
      isColliding(
        { x: m.x, y: m.y, w: 2, h: 2 },
        { x: 4 * TILE_SIZE, y: 4 * TILE_SIZE, w: TILE_SIZE * 2, h: TILE_SIZE }
      )
    ) {
      if (banditToggleCooldown <= 0) {
        States.banditsOn = !States.banditsOn;
        window.localStorage.setItem("banditsOn", States.banditsOn);
        banditToggleCooldown = FRAME_CAP / 3;
      }
    } else {
      _init();
      sfx(0);
    }
    return;
  }
  playerStrobe += 1 / 3;
  if (States.playerControl) {
    if (!heldPiece.piece) {
      unfreshenPieces();
    }

    m.x -= board.x;
    m.y -= board.y;
    m.x = Math.max(0, Math.min(m.x, board.pieces[0].length * TILE_SIZE - 1));
    m.y = Math.max(0, Math.min(m.y, board.pieces.length * TILE_SIZE - 1));
    if (m.mouse1 && heldPiece.timer > 0) {
      let x = Math.floor(m.x / TILE_SIZE);
      let y = Math.floor(m.y / TILE_SIZE);
      let hoverPiece = board.pieces[y][x];
      if (
        !States.pieceHeld &&
        heldPiece.pieceDropped &&
        hoverPiece.color === 0
      ) {
        sfx(1);
        heldPiece.piece = board.pieces[y][x];
        heldPiece.origX = x;
        heldPiece.origY = y;
        heldPiece.piece.x = m.x - TILE_SIZE / 2;
        heldPiece.piece.targetX = heldPiece.piece.x;
        heldPiece.piece.y = m.y - TILE_SIZE / 2;
        heldPiece.piece.targetY = heldPiece.piece.y;
        States.pieceHeld = true;
        heldPiece.timer = pieceHoldLimit * FRAME_CAP;
        heldPiece.firstSwitch = false;
        heldPiece.pieceDropped = false;
      } else if (heldPiece.piece) {
        if (heldPiece.firstSwitch) {
          heldPiece.timer = Math.max(0, heldPiece.timer - 1);
        }
        if (heldPiece.timer > 0) {
          heldPiece.piece.x = Math.max(
            heldPiece.piece.x - TILE_SIZE,
            Math.min(m.x - TILE_SIZE / 2, heldPiece.piece.x + TILE_SIZE)
          );
          heldPiece.piece.targetX = heldPiece.piece.x;
          heldPiece.piece.y = Math.max(
            heldPiece.piece.y - TILE_SIZE,
            Math.min(m.y - TILE_SIZE / 2, heldPiece.piece.y + TILE_SIZE)
          );
          heldPiece.piece.targetY = heldPiece.piece.y;

          let swapX = Math.floor(
            (heldPiece.piece.x + TILE_SIZE / 2) / TILE_SIZE
          );
          let swapY = Math.floor(
            (heldPiece.piece.y + TILE_SIZE / 2) / TILE_SIZE
          );
          let swapPiece = board.pieces[swapY][swapX];
          if (
            swapPiece !== heldPiece.piece &&
            arePiecesColliding(heldPiece.piece, swapPiece)
          ) {
            sfx(2);
            heldPiece.firstSwitch = true;
            swapPieces(swapPiece, swapX, swapY);
          }
        }
      }
      heldPiece.lastX = m.x;
      heldPiece.lastY = m.y;
    } else {
      if (!heldPiece.pieceDropped && !m.mouse1) {
        heldPiece.pieceDropped = true;
      }
      if (States.pieceHeld) {
        if (heldPiece.firstSwitch) {
          blowoutCounter -= 1;
        }
        heldPiece.piece.x = heldPiece.origX * TILE_SIZE;
        heldPiece.piece.targetX = heldPiece.piece.x;
        heldPiece.piece.y = heldPiece.origY * TILE_SIZE;
        heldPiece.piece.targetY = heldPiece.piece.y;
        let combos = markMatchingPieces();
        if (combos.length > 0) {
          sfx(0);
          States.playerControl = false;
          removeComboPieces(combos);
          States.loweringCurrentPieces = true;
        } else if (winStateExists()) {
          winLevel();
        } else if (blowoutCounter <= 0) {
          sfx(5);
          States.levelLost = true;
          updateHighScore();
          States.playerControl = false;
        }

        if (combos.length === 0 && heldPiece.firstSwitch) {
          checkBanditLoseState();
        }
      }
      States.pieceHeld = false;
      heldPiece.piece = undefined;
      heldPiece.timer = pieceHoldLimit * FRAME_CAP;
    }
  } else if (States.loweringCurrentPieces) {
    while (lowerCurrentPieces()) {}
    let movedPieces = movePiecesTowardsTarget();
    if (!movedPieces) {
      let combos = markMatchingPieces();
      if (combos.length > 0) {
        sfx(0);
        States.playerControl = false;
        removeComboPieces(combos);
        States.loweringCurrentPieces = true;
      } else {
        States.loweringCurrentPieces = false;
        States.spawningNewPieces = true;
      }
    }
  } else if (States.spawningNewPieces) {
    replacePieces();
    let movedPieces = movePiecesTowardsTarget();
    if (!movedPieces) {
      let combos = markMatchingPieces();
      if (combos.length > 0) {
        sfx(0);
        States.playerControl = false;
        removeComboPieces(combos);
        States.loweringCurrentPieces = true;
      } else {
        States.spawningNewPieces = false;
        if (winStateExists()) {
          winLevel();
        } else if (blowoutCounter <= 0) {
          States.levelLost = true;
          updateHighScore();
        } else {
          States.playerControl = true;
          checkBanditLoseState();
        }
      }
    }
  }
  updateScoreFloaties();
}

function drawLevelUp() {
  if (!States.levelUpChosen) {
    drawGame();
  }

  rectFill(0, 0, blowoutWidth, HEIGHT, Colors.darkGreen);
  if (blowoutWidth >= WIDTH || States.levelUpChosen) {
    print("make worse:", 4, TILE_SIZE, Colors.white);

    if (States.banditsOn) {
      print("bandits- " + banditMod, 4, TILE_SIZE * 2, Colors.white);
      rect(2, TILE_SIZE * 2 - 3, WIDTH - 3, TILE_SIZE * 2.5 + 2, Colors.white);
    }

    print("bunkers- " + bunkerMod / 100, 4, TILE_SIZE * 3, Colors.white);
    rect(2, TILE_SIZE * 3 - 3, WIDTH - 3, TILE_SIZE * 3.5 + 2, Colors.white);

    print("blowout- " + blowoutMod, 4, TILE_SIZE * 4, Colors.white);
    rect(2, TILE_SIZE * 4 - 3, WIDTH - 3, TILE_SIZE * 4.5 + 2, Colors.white);

    print("score:", 4, TILE_SIZE * 5, Colors.white);
  }
  print(totalScore / 10, 4, TILE_SIZE * 6, Colors.white);
  if (playerIcon) {
    rectFill(
      playerIcon.x - TILE_SIZE - 1,
      playerIcon.y - TILE_SIZE - 1,
      playerIcon.x + TILE_SIZE * 2 + 1,
      playerIcon.y + TILE_SIZE * 2 + 1,
      "black"
    );
    spr(7, playerIcon.x - 16, playerIcon.y - 16);
    spr(7, playerIcon.x, playerIcon.y - 16);
    spr(7, playerIcon.x + 16, playerIcon.y - 16);
    spr(7, playerIcon.x - 16, playerIcon.y);
    spr(0, playerIcon.x, playerIcon.y);
    spr(7, playerIcon.x + 16, playerIcon.y);
    spr(7, playerIcon.x - 16, playerIcon.y + 16);
    spr(7, playerIcon.x, playerIcon.y + 16);
    spr(7, playerIcon.x + 16, playerIcon.y + 16);
  }
}

function updateLevelUp() {
  if (!States.levelUpChosen) {
    blowoutWidth = Math.min(blowoutWidth + 2, WIDTH);
  } else {
    blowoutWidth = Math.max(blowoutWidth - 4, 0);
    if (blowoutWidth === 0) {
      States.levelUpScreen = false;
      States.gameScreen = true;
      States.playerControl = true;
      States.levelUpChosen = false;
      bunkerSpawnScore = 0;
      resetBlowoutCounter();
      return;
    }
  }

  let m = mouse();
  if (m.mouse1 && blowoutWidth >= WIDTH) {
    let mouseBox = { x: m.x, y: m.y, w: 1, h: 1 };
    if (
      isColliding(mouseBox, {
        x: 0,
        y: TILE_SIZE * 2,
        w: WIDTH,
        h: TILE_SIZE,
      }) &&
      States.banditsOn
    ) {
      banditMod += 1;
      States.levelUpChosen = true;
    } else if (
      isColliding(mouseBox, { x: 0, y: TILE_SIZE * 3, w: WIDTH, h: TILE_SIZE })
    ) {
      bunkerMod += 100;
      States.levelUpChosen = true;
    } else if (
      isColliding(mouseBox, { x: 0, y: TILE_SIZE * 4, w: WIDTH, h: TILE_SIZE })
    ) {
      blowoutMod += 1;
      States.levelUpChosen = true;
    }
    if (States.levelUpChosen) {
      board = newBoard(board.x, board.y);
      playerIcon = undefined;
      States.levelWon = false;
      wallPieces = 0;
      sfx(0);
    }
  }
}

function drawGame() {
  drawBoard(board);
  if (States.pieceHeld) {
    drawPiece({
      x: board.x + heldPiece.piece.x,
      y: board.y + heldPiece.piece.y,
      color: heldPiece.piece.color,
    });
  }
  drawBunkerBar(0, 0);
  if (!States.levelLost) {
    print(
      `Blowout: ${blowoutCounter}`,
      TILE_SIZE / 4,
      TILE_SIZE * 1.25,
      Colors.white
    );
  } else {
    rectFill(4, TILE_SIZE * 2, 92, TILE_SIZE * 2 + 30, Colors.darkRed);
    print("BLOWOUT", 4, TILE_SIZE * 2 + 4, Colors.white);
    print("YOU LOSE", 4, TILE_SIZE * 3 + 4, Colors.white);
    print("final score", 4, TILE_SIZE * 5, Colors.white);
    if (States.banditsOn) {
      spr(8, 3 * TILE_SIZE, 4 * TILE_SIZE);
      spr(14, 4 * TILE_SIZE, 4 * TILE_SIZE);
      spr(15, 5 * TILE_SIZE, 4 * TILE_SIZE);
    } else {
      spr(12, 4 * TILE_SIZE, 4 * TILE_SIZE);
      spr(13, 5 * TILE_SIZE, 4 * TILE_SIZE);
    }
  }
  if (States.levelWon) {
    rectFill(4, TILE_SIZE * 2, 92, TILE_SIZE * 2 + 20, Colors.darkGreen);
    print("WIN", WIDTH - 40, TILE_SIZE * 2 + 4, Colors.white);
  }
  if (States.levelLostShot) {
    rectFill(4, TILE_SIZE * 2, 92, TILE_SIZE * 2 + 30, Colors.darkRed);
    print("YOU GOT", 4, TILE_SIZE * 2 + 4, Colors.white);
    print("SHOT", 4, TILE_SIZE * 3 + 4, Colors.white);
    line(
      deathShot[0].x + board.x,
      deathShot[0].y + board.y,
      deathShot[1].x + board.x,
      deathShot[1].y + board.y,
      Colors.darkRed
    );
    if (States.banditsOn) {
      spr(8, 3 * TILE_SIZE, 4 * TILE_SIZE);
      spr(14, 4 * TILE_SIZE, 4 * TILE_SIZE);
      spr(15, 5 * TILE_SIZE, 4 * TILE_SIZE);
    } else {
      spr(12, 4 * TILE_SIZE, 4 * TILE_SIZE);
      spr(13, 5 * TILE_SIZE, 4 * TILE_SIZE);
    }
    print("final score", 4, TILE_SIZE * 5, Colors.white);
  }
  print(totalScore / 10, 4, TILE_SIZE * 6, Colors.white);
  drawScoreFloaties();
  drawHoldTimer();
}

function drawTutorial() {
  print("drag", 0, 0, Colors.white);
  print("man", 0, 8, Colors.white);
  spr(7, tutorialPiece2.x, tutorialPiece2.y);
  spr(5, tutorialPiece1.x, tutorialPiece1.y);
  spr(0, tutorialMan.x, tutorialMan.y);
  let shiftY = TILE_SIZE;
  print("match", 0, 0 + shiftY + 8, Colors.white);
  print("3+", 0, 10 + shiftY + 8, Colors.white);
  let offset = {
    x: TILE_SIZE * 2 + 8,
    y: TILE_SIZE - 8,
  };
  spr(1, 0 + offset.x, 0 + offset.y + shiftY);
  spr(2, TILE_SIZE + offset.x, 0 + offset.y + shiftY);
  spr(3, TILE_SIZE * 2 + offset.x, 0 + offset.y + shiftY);
  spr(1, TILE_SIZE * 3 + offset.x, 0 + offset.y + shiftY);
  spr(4, 0 + offset.x, TILE_SIZE + offset.y + shiftY);
  spr(4, TILE_SIZE + offset.x, TILE_SIZE + offset.y + shiftY);
  spr(4, TILE_SIZE * 2 + offset.x, TILE_SIZE + offset.y + shiftY);
  spr(0, TILE_SIZE * 3 + offset.x, TILE_SIZE + offset.y + shiftY);

  print("fill bar", 0, TILE_SIZE * 2 + 8 + shiftY, Colors.white);
  bunkerSpawnScore = bunkerSpawnTarget * 0.8;
  drawBunkerBar(0, TILE_SIZE * 2 + 18 + shiftY);
  print("=", TILE_SIZE * 4, TILE_SIZE * 2 + 32 + shiftY, Colors.white);
  spr(7, TILE_SIZE * 4 + 10, TILE_SIZE * 2 + 26 + shiftY);
  bunkerSpawnScore = 0;

  print("avoid bandits", 0, TILE_SIZE * 4 + 8 + shiftY, Colors.white);
  spr(8, 0, TILE_SIZE * 5 + shiftY);
  spr(2, TILE_SIZE * 1, TILE_SIZE * 5 + shiftY);
  spr(1, TILE_SIZE * 2, TILE_SIZE * 5 + shiftY);
  spr(5, TILE_SIZE * 3, TILE_SIZE * 5 + shiftY);
  spr(6, TILE_SIZE * 4, TILE_SIZE * 5 + shiftY);
  spr(0, TILE_SIZE * 5, TILE_SIZE * 5 + shiftY);
  rect(
    8,
    TILE_SIZE * 5 + 8 + shiftY,
    TILE_SIZE * 5 + 8,
    TILE_SIZE * 5 + 9 + shiftY,
    Colors.darkRed
  );
  print("X", WIDTH / 2 - 8 + 4, TILE_SIZE * 5 + 2 + shiftY, Colors.lightRed);

  print("encase man", 0, TILE_SIZE * 6 + shiftY, Colors.white);
  print("WIN!", 0, TILE_SIZE * 6 + 30 + shiftY, Colors.white);
  spr(7, TILE_SIZE * 2 + 4, TILE_SIZE * 6 + 10 + shiftY);
  spr(7, TILE_SIZE * 2 + 20, TILE_SIZE * 6 + 10 + shiftY);
  spr(7, TILE_SIZE * 2 + 36, TILE_SIZE * 6 + 10 + shiftY);
  spr(7, TILE_SIZE * 2 + 4, TILE_SIZE * 7 + 10 + shiftY);
  spr(0, TILE_SIZE * 2 + 20, TILE_SIZE * 7 + 10 + shiftY);
  spr(7, TILE_SIZE * 2 + 36, TILE_SIZE * 7 + 10 + shiftY);
  spr(7, TILE_SIZE * 2 + 4, TILE_SIZE * 8 + 10 + shiftY);
  spr(7, TILE_SIZE * 2 + 20, TILE_SIZE * 8 + 10 + shiftY);
  spr(7, TILE_SIZE * 2 + 36, TILE_SIZE * 8 + 10 + shiftY);
  if (highScore) {
    print("high score", 0, HEIGHT - 22);
    print(highScore / 10, 0, HEIGHT - 10);
  }
}

function updateTutorial() {
  inputTimer = Math.max(inputTimer - 1, 0);
  tutorialMan.x += tutorialMan.spd;
  if (tutorialMan.x === TILE_SIZE * 4 && tutorialMan.spd === 1) {
    tutorialPiece1.x = TILE_SIZE * 3;
  } else if (tutorialMan.x === TILE_SIZE * 5 && tutorialMan.spd === 1) {
    tutorialPiece2.x = TILE_SIZE * 4;
    tutorialMan.spd = -1;
  } else if (tutorialMan.x === TILE_SIZE * 4 && tutorialMan.spd === -1) {
    tutorialPiece2.x = TILE_SIZE * 5;
  } else if (tutorialMan.x === TILE_SIZE * 3 && tutorialMan.spd === -1) {
    tutorialPiece1.x = TILE_SIZE * 4;
    tutorialMan.spd = 1;
  }
  if (mouse().mouse1 && inputTimer <= 0) {
    States.tutorialScreen = false;
    States.gameScreen = true;
    sfx(0);
  }
}

function newScoreFloaty(x, y, val) {
  return {
    x: x,
    y: y,
    val: val,
    timer: FRAME_CAP,
  };
}

function drawScoreFloaties() {
  for (let i = 0; i < scoreFloaties.length; ++i) {
    let floaty = scoreFloaties[i];
    if (floaty.timer > 0) {
      print(floaty.val / 10, floaty.x + 2, floaty.y + 4, Colors.white, 8);
      print(floaty.val / 10, floaty.x + 2, floaty.y + 4, Colors.white, 8);
    }
  }
}

function updateScoreFloaties() {
  for (let i = 0; i < scoreFloaties.length; ++i) {
    let floaty = scoreFloaties[i];
    if (floaty.timer > 0) {
      floaty.timer -= 1;
    }
  }
}

function unfreshenPieces() {
  for (let y = 0; y < board.pieces.length; ++y) {
    let row = board.pieces[y];
    for (let x = 0; x < row.length; ++x) {
      let piece = row[x];
      if (piece) {
        piece.fresh = false;
      }
    }
  }
}

function checkBanditLoseState() {
  let shots = checkBanditShots();
  if (shots) {
    sfx(5);
    States.levelLostShot = true;
    updateHighScore();
    States.playerControl = false;
  }
}

function findPlayer() {
  for (let y = 0; y < board.pieces.length; ++y) {
    let row = board.pieces[y];
    for (let x = 0; x < row.length; ++x) {
      let piece = row[x];
      if (piece.color === 0) {
        return [x, y];
      }
    }
  }
}

function resetBlowoutCounter() {
  blowoutCounter = 20 - blowoutMod * 2;
}

function updateHighScore() {
  if (highScore == undefined || totalScore > highScore) {
    window.localStorage.setItem("highScore", totalScore);
  }
}

function winLevel() {
  States.levelWon = true;
  States.playerControl = false;
  sfx(6);
  States.gameScreen = false;
  States.levelUpScreen = true;
  let playerLoc = findPlayer();
  playerIcon = {
    x: board.x + playerLoc[0] * TILE_SIZE,
    y: board.y + playerLoc[1] * TILE_SIZE,
  };
}
