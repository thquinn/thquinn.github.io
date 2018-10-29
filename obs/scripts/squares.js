var canvas = document.getElementById('canvas');

var HUE = Number(urlParams.get('hue') || 220);
const HUESHIFT = Number(urlParams.get('hue_shift') || 0);
const SATURATION = Number(urlParams.get('saturation') || 50);
const SCALE = Number(urlParams.get('scale') || 1);
const AMBIENT_FREQUENCY = Number(urlParams.get('ambient_frequency') || 1);
const WAVE_SPEED = canvas.height / 400 * Number(urlParams.get('wave_speed') || 1);
const WAVE_FREQUENCY = Number(urlParams.get('wave_frequency') || 1);

const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
const squareSize = canvas.height / 22 * SCALE;
const padding = canvas.height / 100 * SCALE;
const minAmbientTimer = Math.floor(240 / AMBIENT_FREQUENCY);
const maxAmbientTimer = Math.ceil(480 / AMBIENT_FREQUENCY);
const excitementDistance = canvas.height / 6;
const minWaveTimer = Math.floor(600 / WAVE_FREQUENCY);
const maxWaveTimer = Math.ceil(1200 / WAVE_FREQUENCY);
const circleWaveFadeFrames = 30;
var ctx = canvas.getContext('2d');

class Square {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.excitementMult = Math.random();
		this.waveMult = 1 - this.excitementMult;
		this.ambientEnd = Math.random();
		this.setNewTarget();
	}
	setNewTarget() {
		this.ambientStart = this.ambientEnd;
		this.ambientEnd = Math.random();
		this.ambientT = 0;
		this.ambientTEnd = Math.randInt(minAmbientTimer, maxAmbientTimer);
	}
	draw() {
		this.ambientT++;
		if (this.ambientT == this.ambientTEnd) {
			this.setNewTarget();
		}
		let ambientExcitement = this.excitementMult * Math.easeInOutQuad(this.ambientT, this.ambientStart, this.ambientEnd - this.ambientStart, this.ambientTEnd);
		let distance = wave ? wave.getDistance(this.x + squareSize / 2, this.y + squareSize / 2) : Number.MAX_SAFE_INTEGER;
		let waveExcitement = distance <= excitementDistance ? this.waveMult * (1 - distance / excitementDistance) : 0;
		let luminosity = ambientExcitement * 15 + waveExcitement * 20 + 20;
		ctx.fillStyle = 'hsl({0}, {1}%, {2}%)'.format(HUE, SATURATION, luminosity);
		ctx.fillRect(this.x, this.y, squareSize, squareSize);		
	}
}

var wave;
var waveCooldown = minWaveTimer;
function killWave() {
	wave = null;
	waveCooldown = Math.randInt(minWaveTimer, maxWaveTimer);
}
class LineWave {
	constructor() {
		// Randomize the direction of the line's travel, perpendicular to the line.
		this.angle = Math.random() * 2 * Math.PI;
		if (this.angle <= Math.PI / 2 || this.angle > 3 * Math.PI / 2) {
			this.x = 0;
		} else {
			this.x = canvas.width;
		}
		if (this.angle <= Math.PI) {
			this.y = 0;
		} else {
			this.y = canvas.height;
		}
		this.x -= Math.cos(this.angle) * excitementDistance;
		this.y -= Math.sin(this.angle) * excitementDistance;
	}
	update() {
		this.x += Math.cos(this.angle) * WAVE_SPEED;
		this.y += Math.sin(this.angle) * WAVE_SPEED;
		let outX = this.x < -excitementDistance || this.x > canvas.width + excitementDistance;
		let outY = this.y < -excitementDistance || this.y > canvas.height + excitementDistance;
		if (outX && outY) {
			killWave();
			return;
		}
		this.x2 = this.x + Math.cos(this.angle + Math.PI / 2);
		this.y2 = this.y + Math.sin(this.angle + Math.PI / 2);
	}
	getDistance(x, y) {
		return Math.pointLineDist(x, y, this.x, this.y, this.x2, this.y2, false);
	}
}
class CircleWave {
	constructor() {
		this.t = 0;
		this.x = Math.random() * canvas.width;
		this.y = Math.random() * canvas.height;
		this.r = 0;
	}
	update() {
		this.t++;
		this.r += WAVE_SPEED;
		if (this.r > diagonal + excitementDistance) {
			killWave();
		}
	}
	getDistance(x, y) {
		let fadeDistance = this.t <= circleWaveFadeFrames ? excitementDistance * (1 - this.t / circleWaveFadeFrames) : 0;
		return Math.abs(Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2)) - this.r) + fadeDistance;
	}
}

var squares = [];
let max_x = Math.ceil((canvas.width - padding) / (squareSize + padding) / 2);
let max_y = Math.ceil((canvas.height - padding) / (squareSize + padding) / 2);
ctx.fillStyle = 'hsl({0}, {1}%, 20%)'.format(HUE, SATURATION);
for (let x = -max_x; x < max_x; x++) {
	for (let y = -max_y; y < max_y; y++) {
		let px = canvas.width / 2 - squareSize / 2 + (x + .5) * (squareSize + padding);
		let py = canvas.height / 2 - squareSize / 2 + (y + .5) * (squareSize + padding);
		squares.push(new Square(px, py));
	}
}
function loop() {
	window.requestAnimationFrame(loop);

	HUE = Math.mod(HUE + HUESHIFT, 360);

	if (wave) {
		wave.update();
	} else {
		waveCooldown--;
		if (waveCooldown == 0) {
			wave = Math.random() < .5 ? new LineWave() : new CircleWave();
		}
	}

	ctx.fillStyle = 'hsl({0}, {1}%, 5%)'.format(HUE, SATURATION);
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	for (let square of squares) {
		square.draw();
	}
}