
const TAU = Math.PI * 2;
const BALLS_COUNT = 1200;
const COLOR_BY_KIND = [
    "#986ade",
    "#490097",
];
const BALL_RADIUS_BY_KIND = [5, 6];
const MASS_BY_KIND = [2, 4];
const SELECTED_COLOR = "#ffd800";
const SELECTED_NEIGHBOR_COLOR = "#ff5d00";
const CURSOR_RADIUS = 20;
const QUADRANT_SIZE = 50;
const RADIUS_OF_INFLUENCE = 50;
const MAX_ACCELERATION = 0;
const MAX_VELOCITY = 5;
const BALL_REPULSION_CONSTANT = 10;
const CURSOR_REPULSION_CONSTANT = 70;
const FRICTION_FACTOR = .99;  // a value between 0 (max friction) and 1 (no friction)
const WAVE_TIME_STEP = 0.01;

class Ball {
    constructor (x, y, kind) {
        this.pos = new Vector(x, y);
        this.kind = kind;
        this.mass = MASS_BY_KIND[kind];
        this.radius = BALL_RADIUS_BY_KIND[kind];
        this.quadrantIndex = -1;
        this.vel = new Vector();
        this.acc = new Vector();
        this.isSelectedNeighbor = false;
    }
}

class App {

    constructor () {
        this.canvas = document.createElement("canvas");
        this.width = this.canvas.width = 1000;
        this.height = this.canvas.height = 800;
        this.ctx = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);

        this.balls = Array.from(Array(BALLS_COUNT),
            () => new Ball(Math.random() * this.width, Math.random() * this.height,
                Math.floor(Math.random() * COLOR_BY_KIND.length)));

        this.QUADRANT_COLS = Math.ceil(this.width / QUADRANT_SIZE);
        this.QUADRANT_ROWS = Math.ceil(this.height / QUADRANT_SIZE);
        this.quadrants = Array.from(Array(this.QUADRANT_COLS * this.QUADRANT_ROWS), () => new Set());
        this.aux = new Vector();

        this.shouldDrawQuadrants = false;
        this.shouldWallsRepel = true;
        this.gravityMode = false;
        this.rockingMode = false;
        this.waveMode = false;
        this.isPaused = false;

        this.waveTime = 0;

        this.cursor = new Vector();
        this.isCursorActive = false;

        this.selectedBall = null;

        for (const ball of this.balls) {
            ball.quadrantIndex = this.getQuadrantIndexByCoordinate(ball.pos.x, ball.pos.y);
            this.quadrants[ball.quadrantIndex].add(ball);
        }

        this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
        this.canvas.addEventListener("mouseout", this.onMouseOut.bind(this));
        window.addEventListener("keypress", this.onKeypress.bind(this));

        this.updateFn = this.update.bind(this);
        requestAnimationFrame(this.updateFn);
    }

    onKeypress(event) {
        switch (event.key) {
            case "r":
                this.selectRandomBall();
                break;
            case "g":
                this.gravityMode = !this.gravityMode;
                break;
            case "q":
                this.shouldDrawQuadrants = !this.shouldDrawQuadrants;
                break;
            case "w":
                this.shouldWallsRepel = !this.shouldWallsRepel;
                break;
            case "o":
                this.rockingMode = !this.rockingMode;
                break;
            case "a":
                this.waveMode = !this.waveMode;
                break;
            case "k":
                this.killVelocities();
                break;
            case " ":
                this.isPaused = !this.isPaused;
                break;
        }
    }

    onMouseMove(event) {
        this.cursor.set(event.offsetX, event.offsetY);
        this.isCursorActive = true;
    }

    onMouseOut(event) {
        this.isCursorActive = false;
    }

    getQuadrantIndexByCoordinate(x, y) {
        const col = Math.floor(x / QUADRANT_SIZE);
        const row = Math.floor(y / QUADRANT_SIZE);
        return row * this.QUADRANT_COLS + col;
    }

    selectRandomBall() {
        this.selectedBall = this.balls[Math.floor(Math.random() * this.balls.length)];
    }

    killVelocities() {
        for (const ball of this.balls) {
            ball.vel.set(0, 0);
        }
    }

    update(t) {
        if (this.isPaused) {
            requestAnimationFrame(this.updateFn);
            return;
        }

        const c = this.ctx;
        c.fillStyle = "#000";
        c.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const wavePhase = Math.cos(this.waveTime);
        this.waveTime += WAVE_TIME_STEP;

        // update balls acceleration
        for (let qi = 0; qi < this.quadrants.length; qi++) {
            const quadrantIndexes = [
                qi,                           // self
                qi - this.QUADRANT_COLS,      // N
                qi - this.QUADRANT_COLS + 1,  // NE
                qi + 1,                       // E
                qi + this.QUADRANT_COLS + 1,  // SE
                qi + this.QUADRANT_COLS,      // S
                qi + this.QUADRANT_COLS - 1,  // SW
                qi - 1,                       // W
                qi - this.QUADRANT_COLS - 1,  // NW
            ];

            // for each ball in that quadrant
            for (const ball of this.quadrants[qi]) {
                ball.acc.clear();
                // for each neighbor quadrant, calculate resulting repulsion
                for (const qi of quadrantIndexes) {
                    if (qi < 0 || qi >= this.quadrants.length) {
                        continue;  // invalid quadrant index
                    }
                    // for each ball in that neighbor quadrant
                    for (const neighbor of this.quadrants[qi]) {
                        if (neighbor === ball) continue;  // self
                        if (this.aux.set(ball.pos).subtract(neighbor.pos).length < RADIUS_OF_INFLUENCE) {
                            const minDistance = ball.radius + neighbor.radius;
                            const force = BALL_REPULSION_CONSTANT * neighbor.mass;
                            this.accumulateForce(ball, neighbor.pos, force, minDistance);

                            if (ball === this.selectedBall) {
                                neighbor.isSelectedNeighbor = true;
                            }
                        }
                    }
                }

                if (this.shouldWallsRepel) {
                    // repulsion coming from top border
                    this.aux.set(ball.pos.x, 0);
                    this.accumulateForce(ball, this.aux, BALL_REPULSION_CONSTANT);
                    // repulsion coming from right border
                    this.aux.set(this.width, ball.pos.y);
                    this.accumulateForce(ball, this.aux, BALL_REPULSION_CONSTANT);
                    // repulsion coming from bottom border
                    this.aux.set(ball.pos.x, this.height);
                    this.accumulateForce(ball, this.aux, BALL_REPULSION_CONSTANT);
                    // repulsion coming from left border
                    this.aux.set(0, ball.pos.y);
                    this.accumulateForce(ball, this.aux, BALL_REPULSION_CONSTANT);
                }

                // repulsion coming from cursor
                if (this.isCursorActive) {
                    this.accumulateForce(ball, this.cursor, CURSOR_REPULSION_CONSTANT);
                }

                if (this.gravityMode) {
                    this.aux.set(0, ball.mass * .05);
                    ball.acc.add(this.aux);
                }

                if (this.rockingMode) {
                    this.aux.set(wavePhase * .1, 0);
                    ball.acc.add(this.aux);
                }

                if (this.waveMode) {
                    const magnitude = ball.pos.x;
                    this.aux.set(wavePhase * 1000 / (magnitude ** 2), 0);
                    ball.acc.add(this.aux);
                }

                if (MAX_ACCELERATION) {
                    const accMagnitude = ball.acc.length;
                    if (accMagnitude > MAX_ACCELERATION) {
                        ball.acc.normalize().scale(MAX_ACCELERATION);  // cap acceleration
                    }
                }

                ball.vel.add(ball.acc);

                if (FRICTION_FACTOR) {
                    // simply steal energy from the velocity vector at each step
                    ball.vel.scale(FRICTION_FACTOR);
                }

                if (MAX_VELOCITY) {
                    // impose maximum velocity so system does not go unstable
                    const velMagnitude = ball.vel.length;
                    if (velMagnitude > MAX_VELOCITY) {
                        ball.vel.normalize().scale(MAX_VELOCITY);  // cap velocity
                    }
                }
            }
        }

        // update balls position and quadrant *after all interactions have been calculated*
        for (const ball of this.balls) {
            ball.pos.add(ball.vel);

            if (this.isCursorActive) {
                // do not let balls stay within cursor radius
                if (this.aux.set(ball.pos).subtract(this.cursor).length < CURSOR_RADIUS) {
                    // escape vector
                    this.aux.normalize();
                    // force position somewhere in the perimeter
                    ball.pos.set(this.aux).scale(CURSOR_RADIUS + ball.radius).add(this.cursor);
                    // keep speed, but change direction to point outwards
                    const velMag = ball.vel.length;
                    ball.vel.set(this.aux).scale(velMag);
                }
            }

            if (ball.pos.x <= 0) ball.pos.x = 1;
            if (ball.pos.x >= this.width) ball.pos.x = this.width - 1;
            if (ball.pos.y <= 0) ball.pos.y = 1;
            if (ball.pos.y >= this.height) ball.pos.y = this.height - 1;

            const currentQuadrantIndex = this.getQuadrantIndexByCoordinate(ball.pos.x, ball.pos.y);
            if (ball.quadrantIndex !== currentQuadrantIndex) {
                this.quadrants[ball.quadrantIndex].delete(ball);
                this.quadrants[currentQuadrantIndex].add(ball);
                ball.quadrantIndex = currentQuadrantIndex;
            }
        }

        // draw quadrants
        if (this.shouldDrawQuadrants) {
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
        }

        // draw balls
        for (const ball of this.balls) {
            c.fillStyle = (ball === this.selectedBall ?
                SELECTED_COLOR : (ball.isSelectedNeighbor ? SELECTED_NEIGHBOR_COLOR : COLOR_BY_KIND[ball.kind]));
            c.beginPath();
            c.arc(ball.pos.x, ball.pos.y, ball.radius, 0, TAU);
            c.fill();

            if (ball === this.selectedBall) {
                c.strokeStyle = SELECTED_COLOR;
                c.beginPath();
                c.arc(ball.pos.x, ball.pos.y, RADIUS_OF_INFLUENCE, 0, TAU);
                c.stroke();
            }

            // reset flags
            ball.isSelectedNeighbor = false;
        }

        if (this.isCursorActive) {
            c.fillStyle = "#8f5fff";
            c.beginPath();
            c.arc(this.cursor.x, this.cursor.y, CURSOR_RADIUS, 0, TAU);
            c.fill();
        }

        requestAnimationFrame(this.updateFn);
    }

    accumulateForce(ball, neighborPos, repulsiveForceConstant, minMagnitude = 1) {
        Vector.subtract(ball.pos, neighborPos, this.aux);
        const magnitude = Math.max(minMagnitude, this.aux.length);
        this.aux.normalize().scale(repulsiveForceConstant / (magnitude ** 2));
        ball.acc.add(this.aux);
    }
}

new App();
