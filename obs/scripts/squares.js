// TODO: Group square draw calls by rounded brightness
// TODO: Mitigate circle distance calls... round and memoize?

var canvas = document.getElementById('canvas');

var HUE = Number(urlParams.get('hue') || 220);
const HUESHIFT = Number(urlParams.get('hue_shift') || 1) * .02;
const SATURATION = Number(urlParams.get('saturation') || 50);
const SCALE = Number(urlParams.get('scale') || 1);
const AMBIENT_FREQUENCY = Number(urlParams.get('ambient_frequency') || 1);
const WAVE_SPEED = canvas.height / 400 * Number(urlParams.get('wave_speed') || 1);
const WAVE_FREQUENCY = Number(urlParams.get('wave_frequency') || 1);
const CIRCLE_CHANCE = Number(urlParams.get('circle_chance') || .5);
const ROUNDING = Number(urlParams.get('rounding') || 0);

const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
const squareSize = canvas.height / 22 * SCALE;
const padding = canvas.height / 102.25 * SCALE;
const minAmbientTimer = Math.floor(240 / AMBIENT_FREQUENCY);
const maxAmbientTimer = Math.ceil(360 / AMBIENT_FREQUENCY);
const excitementDistance = canvas.height / 6;
const minWaveTimer = Math.floor(600 / WAVE_FREQUENCY);
const maxWaveTimer = Math.ceil(1200 / WAVE_FREQUENCY);
const circleWaveFadeFrames = 60;
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
		if (ROUNDING > 0) {
			luminosity = Math.round(luminosity / ROUNDING) * ROUNDING;
		}
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
		let testX1 = this.x - diagonal * Math.cos(this.angle + Math.PI / 2);
		let testY1 = this.y - diagonal * Math.sin(this.angle + Math.PI / 2);
		let testX2 = this.x + diagonal * Math.cos(this.angle + Math.PI / 2);
		let testY2 = this.y + diagonal * Math.sin(this.angle + Math.PI / 2);
		let intersect1 = Math.lineSegmentIntersection(testX1, testY1, testX2, testY2, -excitementDistance, -excitementDistance, canvas.width + excitementDistance, -excitementDistance);
		let intersect2 = Math.lineSegmentIntersection(testX1, testY1, testX2, testY2, -excitementDistance, -excitementDistance, -excitementDistance, canvas.height + excitementDistance);
		let intersect3 = Math.lineSegmentIntersection(testX1, testY1, testX2, testY2, canvas.width + excitementDistance, -excitementDistance, canvas.width + excitementDistance, canvas.height + excitementDistance);
		if (!intersect1 && !intersect2 && !intersect3) {
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
		return Math.abs(Math.hypot(x - this.x ,y - this.y) - this.r) + fadeDistance;
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
			wave = Math.random() > CIRCLE_CHANCE ? new LineWave() : new CircleWave();
		}
	}

	ctx.fillStyle = 'hsl({0}, {1}%, 10%)'.format(HUE, SATURATION);
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	for (let square of squares) {
		square.draw();
	}
}