
const TAU = Math.PI * 2;
const BALLS_COUNT = 100;
const BALL_RADIUS = 5;
const COLORS = [
    "#d69600",
    "#c90093",
];
const QUADRANT_SIZE = 50;

class Ball {
    constructor (x, y, color) {
        this.pos = new Vector(x, y);
        this.color = color;
        this.quadrant = -1;
        this.vel = new Vector();
    }
}

class App {

    constructor () {
        this.canvas = document.createElement("canvas");
        this.width = this.canvas.width = 800;
        this.height = this.canvas.height = 600;
        this.ctx = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);

        this.balls = Array.from(Array(BALLS_COUNT),
            () => new Ball(Math.random() * this.width, Math.random() * this.height, Math.floor(Math.random() * COLORS.length)));

        const QUADRANT_COLS = Math.ceil(this.width / QUADRANT_SIZE);
        const QUADRANT_ROWS = Math.ceil(this.height / QUADRANT_SIZE);
        this.quadrants = Array.from(Array(QUADRANT_COLS * QUADRANT_ROWS), () => new Set());

        // this.colWidth = this.width / QUADRANT_COLS;
        // this.rowHeight = this.height / QUADRANT_ROWS;

        for (const ball of this.balls) {
            const col = Math.floor(ball.pos.x / QUADRANT_SIZE);
            const row = Math.floor(ball.pos.y / QUADRANT_SIZE);
            const i = row * QUADRANT_COLS + col;
            ball.quadrant = i;
            this.quadrants[i].add(ball);
        }

        this.updateFn = this.update.bind(this);
        requestAnimationFrame(this.updateFn);
    }

    update(t) {
        const c = this.ctx;
        c.fillStyle = "#000";
        c.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // quadrants
        c.strokeStyle = "#666";
        for (let y = 0; y < this.height; y += QUADRANT_SIZE) {
            c.beginPath();
            c.moveTo(0, y);
            c.lineTo(this.width, y);
            c.stroke();
        }
        for (let x = 0; x < this.width; x += QUADRANT_SIZE) {
            c.beginPath();
            c.moveTo(x, 0);
            c.lineTo(x, this.height);
            c.stroke();
        }

        // balls
        for (const ball of this.balls) {
            c.fillStyle = COLORS[ball.color];
            c.beginPath();
            c.arc(ball.pos.x, ball.pos.y, BALL_RADIUS, 0, TAU);
            c.fill();
        }
    }
}

new App();
