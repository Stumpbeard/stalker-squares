const States = {
    inited: false,
    playerControl: false,
    pieceHeld: false,
}

function _init() {
    board = newBoard(0, 0)
    heldPiece = {
        piece: undefined,
        lastX: 0,
        lastY: 0,
        origX: 0,
        origY: 0,
    }
    verifyBoard(board)
    States.inited = true
    States.playerControl = true
}

function _update() {
    if (States.playerControl) {
        let m = mouse()
        if (m.mouse1) {
            if (!States.pieceHeld) {
                let x = Math.floor(m.x / TILE_SIZE)
                let y = Math.floor(m.y / TILE_SIZE)
                heldPiece.piece = board.pieces[y][x]
                heldPiece.origX = x
                heldPiece.origY = y
                States.pieceHeld = true
            } else {
                heldPiece.piece.x += m.x - heldPiece.lastX
                heldPiece.piece.y += m.y - heldPiece.lastY
            }
            heldPiece.lastX = m.x
            heldPiece.lastY = m.y
        } else {
            if (States.pieceHeld) {
                heldPiece.piece.x = heldPiece.origX * TILE_SIZE
                heldPiece.piece.y = heldPiece.origY * TILE_SIZE
            }
            States.pieceHeld = false
            heldPiece.piece = undefined
        }
    }
}

function _draw() {
    cls()
    drawBoard(board)
    if (States.pieceHeld) {
        drawPiece(heldPiece.piece)
    }
}

function newPiece(x, y) {
    return {
        x: x,
        y: y,
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
    return {
        x: x,
        y: y,
        pieces: pieces,
    }
}

function drawBoard(board) {
    for (let y = 0; y < board.pieces.length; ++y) {
        let row = board.pieces[y]
        for (let x = 0; x < row.length; ++x) {
            let piece = row[x]
            drawPiece({ x: board.x + piece.x, y: board.y + piece.y, color: piece.color })
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