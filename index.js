function _init() {
    board = createBoard()
    heldPiece = undefined
    heldLoc = { x: 0, y: 0 }
    canSelect = true
    droppedPieces = false
}

function _update() {
    handleInput()
    if (heldPiece) {
        let curMousePos = mouse()
        curMousePos.x -= board.x
        curMousePos.y -= board.y
        heldPiece.offX += curMousePos.x - heldLoc.x
        heldPiece.offY += curMousePos.y - heldLoc.y
        heldLoc = curMousePos
        if (heldPiece.offX >= TILE_SIZE && heldPiece.x < TILE_SIZE * 9) {
            let x = heldPiece.x / TILE_SIZE
            let y = heldPiece.y / TILE_SIZE
            board.tiles[y][x] = board.tiles[y][x + 1]
            board.tiles[y][x].targetX = heldPiece.x
            board.tiles[y][x].targetY = heldPiece.y
            board.tiles[y][x + 1] = heldPiece
            heldPiece.x = (x + 1) * TILE_SIZE
            heldPiece.targetX = heldPiece.x
            heldPiece.offX -= TILE_SIZE
            if (this.butts === "thicc") console.log("damn")
        } else if (heldPiece.offX <= -TILE_SIZE && heldPiece.x > 0) {
            let x = heldPiece.x / TILE_SIZE
            let y = heldPiece.y / TILE_SIZE
            board.tiles[y][x] = board.tiles[y][x - 1]
            board.tiles[y][x].targetX = heldPiece.x
            board.tiles[y][x].targetY = heldPiece.y
            board.tiles[y][x - 1] = heldPiece
            heldPiece.x = (x - 1) * TILE_SIZE
            heldPiece.targetX = heldPiece.x
            heldPiece.offX += TILE_SIZE
        }
        if (heldPiece.offY >= TILE_SIZE && heldPiece.y < TILE_SIZE * 9) {
            let x = heldPiece.x / TILE_SIZE
            let y = heldPiece.y / TILE_SIZE
            board.tiles[y][x] = board.tiles[y + 1][x]
            board.tiles[y][x].targetX = heldPiece.x
            board.tiles[y][x].targetY = heldPiece.y
            board.tiles[y + 1][x] = heldPiece
            heldPiece.y = (y + 1) * TILE_SIZE
            heldPiece.targetY = heldPiece.y
            heldPiece.offY -= TILE_SIZE
        } else if (heldPiece.offY <= -TILE_SIZE && heldPiece.y > 0) {
            let x = heldPiece.x / TILE_SIZE
            let y = heldPiece.y / TILE_SIZE
            board.tiles[y][x] = board.tiles[y - 1][x]
            board.tiles[y][x].targetX = heldPiece.x
            board.tiles[y][x].targetY = heldPiece.y
            board.tiles[y - 1][x] = heldPiece
            heldPiece.y = (y - 1) * TILE_SIZE
            heldPiece.targetY = heldPiece.y
            heldPiece.offY += TILE_SIZE
        }
    }
    if (heldPiece === undefined && canSelect) {
        let matches = true
        while (matches) {
            matches = checkForMatches()
        }
        dropPieces()
    }
    movePiecesTowardsTarget()
}

function _draw() {
    cls()
    drawBoard()
    if (heldPiece) {
        spr(4, heldPiece.x + heldPiece.offX + board.x, heldPiece.y + heldPiece.offY + board.y)
        spr(heldPiece.sprite, heldPiece.x + heldPiece.offX + board.x, heldPiece.y + heldPiece.offY + board.y)
    }
}

function handleInput() {
    if (canSelect) {
        if (heldPiece === undefined && btn("mouse0")) {
            let curMousePos = mouse()
            curMousePos.x -= board.x
            curMousePos.y -= board.y
            let clickedPiece = undefined
            board.tiles.forEach(row => {
                if (clickedPiece) {
                    return
                }
                let ret = undefined
                row.forEach(tile => {
                    if (ret) {
                        return
                    }
                    if (curMousePos.x >= tile.x && curMousePos.x < tile.x + TILE_SIZE && curMousePos.y >= tile.y && curMousePos.y < tile.y + TILE_SIZE) {
                        ret = tile
                        return
                    }
                });
                if (ret) {
                    clickedPiece = ret
                    return
                }
            });
            if (clickedPiece) {
                heldPiece = clickedPiece
                heldLoc = curMousePos
            }
        } else if (heldPiece && !btn("mouse0")) {
            heldPiece.offX = 0
            heldPiece.offY = 0
            heldPiece = undefined
        }
    }
}

function createSquare(x, y, sprite = undefined) {
    return {
        x: x,
        y: y,
        targetX: x,
        targetY: y,
        offX: 0,
        offY: 0,
        sprite: sprite || Math.floor(Math.random() * 4),
        show: true,
        changeShow: false,
    }
}

function createBoard() {
    let tiles = []
    for (let y = 0; y < 10; ++y) {
        let row = []
        for (let x = 0; x < 10; ++x) {
            let tile = createSquare(x * TILE_SIZE, y * TILE_SIZE)
            row.push(tile)
        }
        tiles.push(row)
    }
    return {
        x: 48,
        y: 48,
        tiles: tiles,
    }
}

function drawBoard() {
    board.tiles.forEach(row => {
        row.forEach(tile => {
            if (!tile.show) {
                return
            }
            spr(4, tile.x + tile.offX + board.x, tile.y + tile.offY + board.y)
            spr(tile.sprite, tile.x + tile.offX + board.x, tile.y + tile.offY + board.y)
        });
    });
}

function checkForMatches() {
    let matches = false
    for (let y = 0; y < board.tiles.length; ++y) {
        let row = board.tiles[y]
        let curPieceType = undefined
        let curPieceCnt = 0
        for (let x = 0; x < row.length; ++x) {
            let piece = row[x]
            if (piece.sprite !== curPieceType || !piece.show) {
                curPieceType = piece.sprite
                if (curPieceCnt >= 3) {
                    matches = true
                    let index = curPieceCnt
                    while (index > 0) {
                        board.tiles[y][x - index].changeShow = true
                        index -= 1
                    }
                }
                curPieceCnt = 1
            } else {
                curPieceCnt += 1
            }
        }
        if (curPieceCnt >= 3) {
            matches = true
            let index = curPieceCnt
            while (index > 0) {
                board.tiles[y][10 - index].changeShow = true
                index -= 1
            }
        }
    }

    for (let x = 0; x < 10; ++x) {
        let curPieceType = undefined
        let curPieceCnt = 0
        for (let y = 0; y < 10; ++y) {
            let piece = board.tiles[y][x]
            if (piece.sprite !== curPieceType || !piece.show) {
                curPieceType = piece.sprite
                if (curPieceCnt >= 3) {
                    matches = true
                    let index = curPieceCnt
                    while (index > 0) {
                        board.tiles[y - index][x].changeShow = true
                        index -= 1
                    }
                }
                curPieceCnt = 1
            } else {
                curPieceCnt += 1
            }
        }
        if (curPieceCnt >= 3) {
            matches = true
            let index = curPieceCnt
            while (index > 0) {
                board.tiles[10 - index][x].changeShow = true
                index -= 1
            }
        }
    }

    for (let y = 0; y < 10; ++y) {
        for (let x = 0; x < 10; ++x) {
            if (board.tiles[y][x].changeShow) {
                board.tiles[y][x].show = false
                board.tiles[y][x].changeShow = false
            }
        }
    }

    return matches
}

function dropPieces() {
    for (let x = 0; x < 10; ++x) {
        for (let y = 9; y >= 0; --y) {
            let piece = board.tiles[y][x]
            while (!piece.show) {
                droppedPieces = true
                let counter = y
                let allHidden = true
                while (counter > 0) {
                    board.tiles[counter][x] = board.tiles[counter - 1][x]
                    board.tiles[counter][x].targetY += TILE_SIZE
                    if (board.tiles[counter][x].show) {
                        allHidden = false
                    }
                    counter -= 1
                }
                board.tiles[0][x] = piece
                board.tiles[0][x].y = 0
                piece = board.tiles[y][x]
                if (allHidden) {
                    break
                }
            }
        }
    }
}

function movePiecesTowardsTarget() {
    let changedPos = false
    for (let y = 0; y < 10; ++y) {
        for (let x = 0; x < 10; ++x) {
            let piece = board.tiles[y][x]
            if (piece.show && piece.y !== piece.targetY) {
                piece.y += 8 * Math.sign(piece.targetY - piece.y)
                changedPos = true
            }
            if (piece.show && piece.x !== piece.targetX) {
                piece.x += 8 * Math.sign(piece.targetX - piece.x)
                changedPos = true
            }
        }
    }
    if (!changedPos && droppedPieces) {
        canSelect = false
        droppedPieces = false
        spawnReplacements()
        return
    }
    canSelect = !changedPos
}

function spawnReplacements() {
    for (let y = 0; y < 10; ++y) {
        for (let x = 0; x < 10; ++x) {
            let piece = board.tiles[y][x]
            if (!piece.show) {
                board.tiles[y][x] = createSquare(x * TILE_SIZE, y * TILE_SIZE)
                board.tiles[y][x].y -= 13 * TILE_SIZE
            }
        }
    }
}