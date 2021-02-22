const States = {
    inited: false,
    playerControl: false,
    pieceHeld: false,
    loweringCurrentPieces: false,
    spawningNewPieces: false,
    levelWon: false,
    levelLost: false,
    levelLostShot: false,
}

function _init() {
    bunkerSpawnScore = 0
    bunkerSpawnTarget = 2000
    pieceHoldLimit = 2
    blowoutCounter = 15
    wallPieces = 0
    board = newBoard(0, 0)
    heldPiece = {
        piece: undefined,
        lastX: 0,
        lastY: 0,
        origX: 0,
        origY: 0,
        timer: pieceHoldLimit * FRAME_CAP,
    }
    verifyBoard(board)
    States.inited = true
    States.playerControl = true
}

function _update() {
    if (States.playerControl) {
        let m = mouse()
        if (m.mouse1 && heldPiece.timer > 0) {
            let x = Math.floor(m.x / TILE_SIZE)
            let y = Math.floor(m.y / TILE_SIZE)
            if (!States.pieceHeld) {
                heldPiece.piece = board.pieces[y][x]
                heldPiece.origX = x
                heldPiece.origY = y
                States.pieceHeld = true
                heldPiece.timer = pieceHoldLimit * FRAME_CAP
            } else {
                heldPiece.timer = Math.max(0, heldPiece.timer - 1)
                if (heldPiece.timer > 0) {
                    heldPiece.piece.x += m.x - heldPiece.lastX
                    heldPiece.piece.targetX = heldPiece.piece.x
                    heldPiece.piece.y += m.y - heldPiece.lastY
                    heldPiece.piece.targetY = heldPiece.piece.y
                    if (y < board.pieces.length && x < board.pieces[0].length) {
                        let swapPiece = board.pieces[y][x]
                        if (piecesColliding(heldPiece.piece, swapPiece)) {
                            swapPieces(swapPiece, x, y)
                        }
                    }
                }
            }
            heldPiece.lastX = m.x
            heldPiece.lastY = m.y
        } else {
            if (States.pieceHeld) {
                blowoutCounter -= 1
                heldPiece.piece.x = heldPiece.origX * TILE_SIZE
                heldPiece.piece.targetX = heldPiece.piece.x
                heldPiece.piece.y = heldPiece.origY * TILE_SIZE
                heldPiece.piece.targetY = heldPiece.piece.y
                let combos = markMatchingPieces()
                if (combos.length > 0) {
                    States.playerControl = false
                    removeComboPieces(combos)
                    States.loweringCurrentPieces = true
                } else if (winStateExists()) {
                    States.levelWon = true
                    States.playerControl = false
                } else if (blowoutCounter <= 0) {
                    States.levelLost = true
                    States.playerControl = false
                }

                if (combos.length === 0) {
                    let shots = checkBanditShots()
                    if (shots) {
                        States.levelLostShot = true
                        States.playerControl = false
                    }
                }
            }
            States.pieceHeld = false
            heldPiece.piece = undefined
            heldPiece.timer = pieceHoldLimit * FRAME_CAP
        }
    } else if (States.loweringCurrentPieces) {
        while (lowerCurrentPieces()) {}
        let movedPieces = movePiecesTowardsTarget()
        if (!movedPieces) {
            let combos = markMatchingPieces()
            if (combos.length > 0) {
                States.playerControl = false
                removeComboPieces(combos)
                States.loweringCurrentPieces = true
            } else {
                States.loweringCurrentPieces = false
                States.spawningNewPieces = true
            }
        }
    } else if (States.spawningNewPieces) {
        replacePieces()
        let movedPieces = movePiecesTowardsTarget()
        if (!movedPieces) {
            let combos = markMatchingPieces()
            if (combos.length > 0) {
                States.playerControl = false
                removeComboPieces(combos)
                States.loweringCurrentPieces = true
            } else {
                States.spawningNewPieces = false
                if (winStateExists()) {
                    console.log("setting win state")
                    States.levelWon = true
                } else if (blowoutCounter <= 0) {
                    States.levelLost = true
                } else {
                    States.playerControl = true
                }
            }
        }
    }
}

function _draw() {
    cls()
    drawBoard(board)
    if (States.pieceHeld) {
        drawPiece(heldPiece.piece)
    }
    drawBunkerBar(0, 80)
    if (!States.levelLost) {
        print(`Blowout: ${blowoutCounter}`, 4, 100, "white")
    } else {
        rectFill(4, 100, 92, 156, "red")
        print("LOSE", 4, 100, "white")
    }
    if (States.levelWon) {
        rectFill(4, 100, 92, 156, "green")
        print("WIN", 4, 100, "white")
    }
    if (States.levelLostShot) {
        rectFill(4, 100, 92, 156, "red")
        print("YOU GOT SHOT", 4, 100, "white")
    }
    drawHoldTimer()
}

function newPiece(x, y) {
    return {
        x: x,
        targetX: x,
        y: y,
        targetY: y,
        color: Math.floor(Math.random() * 6) + 1
    }
}

function drawPiece(piece) {
    spr(piece.color, piece.x, piece.y)
}

function newBoard(x, y) {
    let pieces = []
    for (let y = 0; y < 5; ++y) {
        let row = []
        for (let x = 0; x < 6; ++x) {
            let piece = newPiece(x * TILE_SIZE, y * TILE_SIZE)
            row.push(piece)
        }
        pieces.push(row)
    }
    let stalkerX = Math.floor(Math.random() * pieces[0].length)
    let stalkerY = Math.floor(Math.random() * pieces.length)
    pieces[stalkerY][stalkerX].color = 0
    return {
        x: x,
        y: y,
        pieces: pieces,
        marked: false,
    }
}

function drawBoard(board) {
    for (let y = 0; y < board.pieces.length; ++y) {
        let row = board.pieces[y]
        for (let x = 0; x < row.length; ++x) {
            let piece = row[x]
            if (piece) {
                drawPiece({ x: board.x + piece.x, y: board.y + piece.y, color: piece.color })
            }
        }
    }
}

function verifyBoard(board) {
    let movedPieces = true
    while (movedPieces) {
        movedPieces = false
        for (let y = 0; y < board.pieces.length; ++y) {
            let row = board.pieces[y]
            let prevColor = undefined
            let curColor = undefined
            let consecutive = 0
            for (let x = 0; x < row.length; ++x) {
                let piece = row[x]
                curColor = piece.color
                if (prevColor === curColor) {
                    consecutive += 1
                    if (consecutive >= 3) {
                        piece.color = Math.max((piece.color + 1) % 7, 1)
                        movedPieces = true
                        consecutive = 1
                        curColor = piece.color
                    }
                } else {
                    consecutive = 1
                }
                prevColor = curColor
            }
        }

        for (let x = 0; x < board.pieces[0].length; ++x) {
            let prevColor = undefined
            let curColor = undefined
            let consecutive = 0
            for (let y = 0; y < board.pieces.length; ++y) {
                let piece = board.pieces[y][x]
                curColor = piece.color
                if (prevColor === curColor) {
                    consecutive += 1
                    if (consecutive >= 3) {
                        piece.color = Math.max((piece.color + 1) % 7, 1)
                        movedPieces = true
                        consecutive = 1
                        curColor = piece.color
                    }
                } else {
                    consecutive = 1
                }
                prevColor = curColor
            }
        }
    }
}

function piecesColliding(piece1, piece2) {
    return piece1 !== piece2
}

function swapPieces(swapPiece, x, y) {
    board.pieces[heldPiece.origY][heldPiece.origX] = swapPiece
    if (swapPiece) {
        swapPiece.x = heldPiece.origX * TILE_SIZE
        swapPiece.targetX = swapPiece.x
        swapPiece.y = heldPiece.origY * TILE_SIZE
        swapPiece.targetY = swapPiece.y
    }
    board.pieces[y][x] = heldPiece.piece
    heldPiece.origX = x
    heldPiece.origY = y
}

function markMatchingPieces() {
    let combos = []

    // rows
    for (let y = 0; y < board.pieces.length; ++y) {
        let row = board.pieces[y]
        let curColor = undefined
        let comboCount = 0
        for (let x = 0; x < row.length; ++x) {
            let piece = row[x]
            if (piece && piece.color !== 7 && piece.color === curColor) {
                comboCount += 1
            } else {
                if (comboCount >= 3) {
                    let combo = []
                    for (let j = x - 1; j >= x - comboCount; --j) {
                        board.pieces[y][j].marked = true
                        combo.push(board.pieces[y][j])
                    }
                    combos.push(combo)
                }
                if (piece) {
                    curColor = piece.color
                } else {
                    curColor = undefined
                }
                comboCount = 1
            }
        }
        if (comboCount >= 3) {
            let combo = []
            for (let j = row.length - 1; j >= row.length - comboCount; --j) {
                board.pieces[y][j].marked = true
                combo.push(board.pieces[y][j])
            }
            combos.push(combo)
        }
    }

    // columns
    for (let x = 0; x < board.pieces[0].length; ++x) {
        let curColor = undefined
        let comboCount = 0
        for (let y = 0; y < board.pieces.length; ++y) {
            let piece = board.pieces[y][x]
            if (piece && piece.color !== 7 && piece.color === curColor) {
                comboCount += 1
            } else {
                if (comboCount >= 3) {
                    let combo = []
                    for (let j = y - 1; j >= y - comboCount; --j) {
                        board.pieces[j][x].marked = true
                        combo.push(board.pieces[j][x])
                    }
                    combos.push(combo)
                }
                if (piece) {
                    curColor = piece.color
                } else {
                    curColor = undefined
                }
                comboCount = 1
            }
        }
        if (comboCount >= 3) {
            let combo = []
            for (let j = board.pieces.length - 1; j >= board.pieces.length - comboCount; --j) {
                board.pieces[j][x].marked = true
                combo.push(board.pieces[j][x])
            }
            combos.push(combo)
        }
    }

    let foundMerge = true
    while (foundMerge) {
        foundMerge = false
        for (let i = 0; i < combos.length; ++i) {
            let curCombo = combos[i]
            for (let j = i + 1; j < combos.length; ++j) {
                let nextCombo = combos[j]
                let checker = {}
                for (let y = 0; y < curCombo.length; ++y) {
                    checker[JSON.stringify(curCombo[y])] = true
                }
                let merged = false
                for (let z = 0; z < curCombo.length; ++z) {
                    if (checker[JSON.stringify(nextCombo[z])]) {
                        combos[i] = new Set(curCombo.concat(nextCombo))
                        combos[i] = [...combos[i]]
                        combos.splice(j)
                        merged = true
                        foundMerge = true
                    }
                }
                if (merged) {
                    break
                }
            }
        }
    }
    return combos
}

function replacePieces() {
    let replacedPieces = []
    for (let y = 0; y < board.pieces.length; ++y) {
        let row = board.pieces[y]
        for (let x = 0; x < row.length; ++x) {
            let piece = row[x]
            if (!piece) {
                let createdPiece = newPiece(x * TILE_SIZE, y * TILE_SIZE)
                createdPiece.y -= HEIGHT / 2
                tryForBandit(createdPiece)
                replacedPieces.push([x, y, createdPiece])
            }
        }
    }

    let newWalls = Math.floor(bunkerSpawnScore / bunkerSpawnTarget)
    bunkerSpawnScore = bunkerSpawnScore % bunkerSpawnTarget

    while (newWalls > 0) {
        let roll = Math.floor(Math.random() * replacedPieces.length)
        let piece = replacedPieces[roll][2]
        if (piece.color !== 7) {
            piece.color = 7
            newWalls -= 1
            wallPieces += 1
        }
    }

    for (let i = 0; i < replacedPieces.length; ++i) {
        let p = replacedPieces[i]
        board.pieces[p[1]][p[0]] = p[2]
    }
}

function movePiecesTowardsTarget() {
    let movedPieces = false
    for (let y = 0; y < board.pieces.length; ++y) {
        let row = board.pieces[y]
        for (let x = 0; x < row.length; ++x) {
            let piece = row[x]
            if (piece && piece.y < piece.targetY) {
                piece.y += 4
                movedPieces = true
            }
        }
    }

    return movedPieces
}

function removeComboPieces(combos) {
    for (let i = 0; i < combos.length; ++i) {
        let curCombo = combos[i]
        let perPieceBonus = (curCombo.length - 2) * 100
        for (let j = 0; j < curCombo.length; ++j) {
            let piece = curCombo[j]
            let xCoord = Math.floor(piece.x / TILE_SIZE)
            let yCoord = Math.floor(piece.y / TILE_SIZE)
            board.pieces[yCoord][xCoord] = undefined
            bunkerSpawnScore += perPieceBonus
        }
    }
}

function lowerCurrentPieces() {
    let loweredPiece = false
    for (let y = board.pieces.length - 2; y >= 0; --y) {
        let row = board.pieces[y]
        for (let x = 0; x < row.length; ++x) {
            let piece = row[x]
            if (y + 1 < board.pieces.length && board.pieces[y + 1][x] === undefined) {
                board.pieces[y + 1][x] = piece
                if (board.pieces[y + 1][x] !== undefined) {
                    piece.targetY += TILE_SIZE
                    loweredPiece = true
                }
                board.pieces[y][x] = undefined
            }
        }
    }

    return loweredPiece
}

function drawBunkerBar(x, y) {
    rect(x, y, x + 96, y + 16, "gray")
    rectFill(x + 1, y + 1, x + 1 + Math.floor((95 - 1) / bunkerSpawnTarget * bunkerSpawnScore), y + 16 - 1, "red")
}

function drawHoldTimer() {
    if (heldPiece.piece) {
        rect(heldPiece.piece.x, heldPiece.piece.y + TILE_SIZE, heldPiece.piece.x + Math.floor(TILE_SIZE / (pieceHoldLimit * FRAME_CAP) * heldPiece.timer), heldPiece.piece.y + TILE_SIZE, "green")
    }
}

function winStateExists() {
    for (let y = 0; y < board.pieces.length - 2; ++y) {
        let row = board.pieces[y]
        for (let x = 0; x < row.length - 2; ++x) {
            let piece = row[x]
            if (piece && piece.color === 7) {
                if (board.pieces[y][x + 1].color === 7 &&
                    board.pieces[y][x + 2].color === 7 &&
                    board.pieces[y + 1][x].color === 7 &&
                    board.pieces[y + 1][x + 1].color === 0 &&
                    board.pieces[y + 1][x + 2].color === 7 &&
                    board.pieces[y + 2][x].color === 7 &&
                    board.pieces[y + 2][x + 1].color === 7 &&
                    board.pieces[y + 2][x + 2].color === 7) {
                    return true
                }
            }
        }
    }

    return false
}

function tryForBandit(piece) {
    const chance = 16 - wallPieces
    const roll = Math.floor(Math.random() * chance)
    if (roll === 0) {
        piece.color = 8
    }
}

function checkBanditShots() {
    for (let y = 0; y < board.pieces.length; ++y) {
        let row = board.pieces[y]
        for (let x = 0; x < row.length; ++x) {
            let piece = row[x]
            if (piece && piece.color === 8) {
                for (let i = y; i >= 0; --i) {
                    let target = board.pieces[i][x]
                    if (target !== piece && target && (target.color === 7 || target.color === 8)) {
                        break
                    } else if (target && target.color === 0) {
                        return true
                    }
                }
                for (let i = y; i < board.pieces.length; ++i) {
                    let target = board.pieces[i][x]
                    if (target !== piece && target && (target.color === 7 || target.color === 8)) {
                        break
                    } else if (target && target.color === 0) {
                        return true
                    }
                }
                for (let i = x; i >= 0; --i) {
                    let target = board.pieces[y][i]
                    if (target !== piece && target && (target.color === 7 || target.color === 8)) {
                        break
                    } else if (target && target.color === 0) {
                        return true
                    }
                }
                for (let i = x; i < board.pieces[y].length; ++i) {
                    let target = board.pieces[y][i]
                    if (target !== piece && target && (target.color === 7 || target.color === 8)) {
                        break
                    } else if (target && target.color === 0) {
                        return true
                    }
                }
            }
        }
    }
}