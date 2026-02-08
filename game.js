const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const blocksDiv = document.getElementById("blocks");
const scoreDiv = document.getElementById("score");
const bestDiv = document.getElementById("best");
const placeSound = new Audio("assets/place.mp3");
const clearSound = new Audio("assets/clear.mp3");
const overSound = new Audio("assets/over.mp3");
const popup = document.getElementById("gameOver");
const finalScore = document.getElementById("finalScore");
const highScoreTxt = document.getElementById("highScore");
const restartBtn = document.getElementById("restartBtn");
const bonusDiv = document.getElementById("bonus");

let highScore = localStorage.getItem("highscore") || 0;
bestDiv.innerText = "Best: " + highScore;

const SIZE = 9;
const CELL = 40;

let board = [];
let score = 0;

let currentBlocks = [];
let dragging = false;
let dragShape = null;
let dragX = 0;
let dragY = 0;

// Shapes
const SHAPES = [
    [[1, 1, 1]],
    [[1], [1], [1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 0], [1, 0], [1, 1]],
    [[0, 1], [0, 1], [1, 1]],
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]]
];

// Init
function initBoard() {
    for (let i = 0; i < SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < SIZE; j++) {
            board[i][j] = 0;
        }
    }
}

// Draw Board
function drawBoard() {
    ctx.clearRect(0, 0, 360, 360);

    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {

            ctx.strokeStyle = "#7b4a12";
            ctx.strokeRect(j * CELL, i * CELL, CELL, CELL);

            if (board[i][j]) {
                ctx.fillStyle = "#8b4513";
                ctx.fillRect(j * CELL + 2, i * CELL + 2, 36, 36);
            }
        }
    }

    drawGhost();
}

// Draw Ghost Preview
function drawGhost() {

    if (!dragging || !dragShape) return;

    let gx = Math.floor(dragX / CELL);
    let gy = Math.floor(dragY / CELL);

    let ok = canPlace(dragShape, gy, gx);

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = ok ? "#4caf50" : "#f44336";

    for (let y = 0; y < dragShape.length; y++) {
        for (let x = 0; x < dragShape[0].length; x++) {

            if (dragShape[y][x]) {

                let px = (gx + x) * CELL;
                let py = (gy + y) * CELL;

                ctx.fillRect(px + 2, py + 2, 36, 36);
            }
        }
    }

    ctx.globalAlpha = 1;
}

// Create Blocks
function createBlocks() {

    blocksDiv.innerHTML = "";
    currentBlocks = [];

    for (let i = 0; i < 3; i++) {

        let shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];

        let c = document.createElement("canvas");
        c.style.maxWidth = "100%";
        c.style.maxHeight = "100%";

        c.width = shape[0].length * 30;
        c.height = shape.length * 30;
        c.className = "block";

        let g = c.getContext("2d");

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[0].length; x++) {

                if (shape[y][x]) {
                    g.fillStyle = "#8b4513";
                    g.fillRect(x * 30 + 2, y * 30 + 2, 26, 26);
                }
            }
        }

        // Mouse
        c.addEventListener("mousedown", () => startDrag(shape));

        // Touch
        c.addEventListener("touchstart", (e) => {
            e.preventDefault();
            startDrag(shape);
        });

        blocksDiv.appendChild(c);
        currentBlocks.push(shape);
    }
}

// Start Drag
function startDrag(shape) {
    dragging = true;
    dragShape = shape;
}

// Drag Move
document.addEventListener("mousemove", e => {

    if (!dragging) return;

    let rect = canvas.getBoundingClientRect();

    dragX = e.clientX - rect.left;
    dragY = e.clientY - rect.top;

    drawBoard();
});

document.addEventListener("touchmove", e => {

    if (!dragging) return;

    e.preventDefault();

    let pos = getTouchPos(e);

    dragX = pos.x;
    dragY = pos.y;

    drawBoard();
}, { passive: false });


// Drop
document.addEventListener("mouseup", drop);
document.addEventListener("touchend", drop);

function drop() {

    if (!dragging) return;

    let gx = Math.floor(dragX / CELL);
    let gy = Math.floor(dragY / CELL);

    if (canPlace(dragShape, gy, gx)) {
        place(dragShape, gy, gx);
    }

    dragging = false;
    dragShape = null;

    drawBoard();
}

// Check Place
function canPlace(shape, r, c) {

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[0].length; x++) {

            if (shape[y][x]) {

                let ny = r + y;
                let nx = c + x;

                if (ny < 0 || nx < 0 || ny >= SIZE || nx >= SIZE) return false;
                if (board[ny][nx]) return false;
            }
        }
    }

    return true;
}

// Place
function place(shape, r, c) {

    if (navigator.vibrate) {
        navigator.vibrate(30); // vibration
    }

    placeSound.play();

    canvas.classList.add("place-anim");

    setTimeout(() => {
        canvas.classList.remove("place-anim");
    }, 150);


    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[0].length; x++) {

            if (shape[y][x]) {
                board[r + y][c + x] = 1;
                score++;
            }
        }
    }

    clearLines();

    scoreDiv.innerText = "Score: " + score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highscore", highScore);
        bestDiv.innerText = "Best: " + highScore;
    }


    createBlocks();
    drawBoard();

    if (checkGameOver()) {
        gameOver();
    }
}


// Clear Lines
function clearLines() {

    let cleared = false;

    // Rows
    for (let i = 0; i < SIZE; i++) {
        if (board[i].every(v => v)) {
            board[i].fill(0);
            score += 10;
            cleared = true;
        }
    }

    // Cols
    for (let j = 0; j < SIZE; j++) {

        let full = true;

        for (let i = 0; i < SIZE; i++) {
            if (!board[i][j]) full = false;
        }

        if (full) {

            for (let i = 0; i < SIZE; i++) {
                board[i][j] = 0;
            }

            score += 10;
            cleared = true;
        }
    }

    // Smooth UI Update
    if (cleared) {

        requestAnimationFrame(() => {

            drawBoard();

            // Glow
            canvas.classList.add("glow");

            setTimeout(() => {
                canvas.classList.remove("glow");
            }, 200);

            // Sound
            clearSound.currentTime = 0;
            clearSound.play();

            // Bonus
            showBonus("+10");

        });

    }
}



function getTouchPos(e) {

    let rect = canvas.getBoundingClientRect();
    let t = e.touches[0];

    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;

    return {
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top) * scaleY
    };
}

restartBtn.onclick = restartGame;

function restartGame() {

    board = [];
    score = 0;

    initBoard();
    drawBoard();
    createBlocks();

    scoreDiv.innerText = "Score: 0";

    popup.style.display = "none";
}

function checkGameOver() {

    for (let shape of currentBlocks) {

        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {

                if (canPlace(shape, i, j)) {
                    return false;
                }
            }
        }
    }

    return true;
}

function gameOver() {

    overSound.play();

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highscore", highScore);
    }

    finalScore.innerText = score;
    highScoreTxt.innerText = highScore;

    popup.style.display = "flex";
}

function showBonus(text) {

    bonusDiv.innerText = text;
    bonusDiv.style.display = "block";

    setTimeout(() => {
        bonusDiv.style.display = "none";
    }, 1000);
}



// Start
initBoard();
drawBoard();
createBlocks();
