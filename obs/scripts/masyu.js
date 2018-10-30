var canvas = document.getElementById('canvas');

var HUE = Number(urlParams.get('hue') || 203);
var SCROLL_ANGLE = Number(urlParams.get('scroll_angle') || -15) * Math.PI / 180;
var SCROLL_SPEED = Number(urlParams.get('scroll_speed') || 11) * canvas.height / 10000;
var GRID_ANGLE = Number(urlParams.get('grid_angle') || -10) * Math.PI / 180;
var GRID_STROKE = Number(urlParams.get('grid_stroke') || 1) * canvas.height / 300;
var SPACING = Number(urlParams.get('spacing') || 1) * canvas.height / 20;
var POLY_COLOR = urlParams.get('poly_color') || '#3B3E40';
var POLY_STROKE = Number(urlParams.get('poly_stroke') || 4) * GRID_STROKE;
var DRAW_RATE = Number(urlParams.get('draw_rate') || 1) * .00075;
var FILL_DELAY = Number(urlParams.get('fill_delay') || 60);
var FILL_RATE = Number(urlParams.get('fill_rate') || .005);

const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
var ctx = canvas.getContext('2d');
ctx.lineJoin = 'round';
ctx.lineCap = 'round';

function withinSquaredCanvas(x, y) {
	let maxLeg = Math.max(canvas.width, canvas.height) * 2 / 3;
	let xDist = Math.abs(x - canvas.width / 2);
	let yDist = Math.abs(y - canvas.height / 2);
	return xDist <= maxLeg && yDist <= maxLeg;
}
var gridOffsetX = 0, gridOffsetY = 0;
function drawGrid() {
	ctx.strokeStyle = 'hsl({0}, 67%, 94%)'.format(HUE);
	ctx.lineWidth = GRID_STROKE;
	for (let angle of [GRID_ANGLE, GRID_ANGLE + Math.PI / 2]) {
		let first = true;
		for (let distance of [SPACING, -SPACING]) {
			let x = canvas.width / 2;
			let y = canvas.height / 2;
			while (withinSquaredCanvas(x, y)) {
				if (!first) {
					ctx.beginPath();
					ctx.moveTo(x - Math.cos(angle) * diagonal + gridOffsetX, y - Math.sin(angle) * diagonal + gridOffsetY);
					ctx.lineTo(x + Math.cos(angle) * diagonal + gridOffsetX, y + Math.sin(angle) * diagonal + gridOffsetY);
					ctx.stroke();
				}
				first = false;
				x += Math.cos(angle + Math.PI / 2) * distance;
				y += Math.sin(angle + Math.PI / 2) * distance;
			}
		}
	}
}

const NEIGHBORS = [[-1, 0], [0, -1], [1, 0], [0, 1]];
class Polyomino {
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		// Create the polyomino to outline.
		let squareCoors = new StringSet();
		let borderCoors = new StringSet();
		let badCoors = new StringSet();
		let start = [Math.randInt(0, width - 2), Math.randInt(0, height - 1)];
		borderCoors.add(start);
		while (borderCoors.size() > 0) {
			// Sometimes don't fill in the entire available area.
			let fillPercent = squareCoors.size() / ((width - 1) * (height - 1));
			if (fillPercent > .525 && Math.random() < .2) {
				break;
			}

			let current = borderCoors.random();
			borderCoors.remove(current);
			badCoors.add(current);
			let doesntEnclose = true;
			for (let neighbor of NEIGHBORS) {
				let next = [current[0] + neighbor[0], current[1] + neighbor[1]];
				if (next[0] < 0 || next[0] > width - 2 || next[1] < 0 || next[1] > height - 2) {
					continue;
				}
				if (squareCoors.has(next)) {
					continue;
				}
				if (!this.checkIsntEnclosed(next, squareCoors, current)) {
					doesntEnclose = false;
					break;
				}
			}
			if (!doesntEnclose) {
				continue;
			}
			squareCoors.add(current);
			let randomNeighbors = shuffleArray(NEIGHBORS.slice());
			for (let neighbor of randomNeighbors) {
				let next = [current[0] + neighbor[0], current[1] + neighbor[1]];
				if (next[0] < 0 || next[0] > width - 2 || next[1] < 0 || next[1] > height - 2) {
					continue;
				}
				if (badCoors.has(next)) {
					continue;
				}
				if (borderCoors.has(next)) {
					borderCoors.remove(next);
					badCoors.add(next);
				} else {
					borderCoors.add(next);
				}
			}
		}
		// Create the outline of the polyomino.
		while (true) {
			let testLeft = [start[0] - 1, start[1]];
			if (squareCoors.has(testLeft)) {
				start = testLeft;
			} else {
				break;
			}
		}
		let direction = 1;
		let outlineCoors = [];
		outlineCoors.push([start[0], start[1] + 1]);
		while (outlineCoors.length < 2 || !arraysEqual(outlineCoors[0], outlineCoors[outlineCoors.length - 1])) {
			let neighbor = NEIGHBORS[direction];
			let test = [start[0] + neighbor[0], start[1] + neighbor[1]];
			// Edge.
			if (!squareCoors.has(test)) {
				if (direction == 1) {
					outlineCoors.push([start[0], start[1]]);
				} else if (direction == 2) {
					outlineCoors.push([start[0] + 1, start[1]]);
				} else if (direction == 3) {
					outlineCoors.push([start[0] + 1, start[1] + 1]);
				} else {
					outlineCoors.push([start[0], start[1] + 1]);
				}
				direction = Math.mod(direction + 1, 4);
				continue;
			}
			start = test;
			direction = Math.mod(direction - 1, 4);
		}
		this.outlineCoors = outlineCoors;
		this.percentDrawn = 0;
		this.fillDelay = 0;
		this.fillOpacity = 0;
	}
	// Check there's a path from emptyCoor to the perimeter if filledCoors and newCoor are filled.
	checkIsntEnclosed(emptyCoor, filledCoors, newCoor) {
		let stack = [emptyCoor];
		let seen = new StringSet();
		seen.add(emptyCoor);
		while (stack.length > 0) {
			let current = stack.pop();
			for (let neighbor of NEIGHBORS) {
				let next = [current[0] + neighbor[0], current[1] + neighbor[1]];
				if (next[0] < -1 || next[0] > this.width - 1 || next[1] < -1 || next[1] > this.height - 1) {
					continue;
				}
				if (seen.has(next)) {
					continue;
				}
				seen.add(next);
				if (filledCoors.has(next) || arraysEqual(next, newCoor)) {
					continue;
				}
				if (next[0] == 0 || next[0] == this.width - 2 || next[1] == 0 || next[1] == this.height - 2) {
					return true;
				}
				stack.push(next);
			}
		}
		return false;
	}

	update() {
		this.x -= Math.cos(SCROLL_ANGLE) * SCROLL_SPEED;
		this.y -= Math.sin(SCROLL_ANGLE) * SCROLL_SPEED;
		this.percentDrawn = Math.min(1, this.percentDrawn + DRAW_RATE);
		if (this.percentDrawn == 1) {
			this.fillDelay = Math.min(FILL_DELAY, this.fillDelay + 1);
		}
		if (this.fillDelay == FILL_DELAY) {
			this.fillOpacity = Math.min(1, this.fillOpacity + FILL_RATE);
		}
	}
	draw() {
		let lineWidth = POLY_STROKE * (1 - this.fillOpacity);
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = lineWidth > 0 ? POLY_COLOR : 'transparent';
		let numVertices = (this.outlineCoors.length - 1) * this.percentDrawn;
		for (let i = 0; i < numVertices; i++) {
			let coor = this.outlineCoors[i];
			let xy = this.convertToScreenSpace(coor[0], coor[1]);
			if (i == 0) {
				ctx.moveTo(xy[0], xy[1]);
			} else {
				ctx.lineTo(xy[0], xy[1]);
			}
		}
		if (this.percentDrawn == 1) {
			ctx.closePath();
		} else {
			let baseIndex = Math.floor(numVertices);
			let remainder = numVertices - baseIndex;
			let x2 = Math.lerp(this.outlineCoors[baseIndex][0], this.outlineCoors[baseIndex + 1][0], remainder);
			let y2 = Math.lerp(this.outlineCoors[baseIndex][1], this.outlineCoors[baseIndex + 1][1], remainder);
			let xy = this.convertToScreenSpace(x2, y2);
			ctx.lineTo(xy[0], xy[1]);
		}
		ctx.stroke();
		if (this.fillOpacity > 0) {
			ctx.fillStyle = "rgba(59, 62, 64, {0})".format(this.fillOpacity);
			ctx.fill();
		}
	}
	convertToScreenSpace(x, y) {
		x -= (this.width - 1) / 2;
		y -= (this.height - 1) / 2;
		let rot = this.rotateFromZero(x * SPACING, y * SPACING, GRID_ANGLE);
		return [rot[0] + this.x, rot[1] + this.y];
	}
	rotateFromZero(x, y, theta) {
		let sin = Math.sin(theta);
		let cos = Math.cos(theta);
		return [x * cos - y * sin, x * sin + y * cos];
	}
}

var polyominos = [];
polyominos.push(new Polyomino(canvas.width - 14, -10, 8, 8));
polyominos.push(new Polyomino(canvas.width * 1.25 + 12, canvas.height / 3 + 33, 10, 10));
function loop() {
	window.requestAnimationFrame(loop);
	ctx.fillStyle = 'hsl({0}, 89%, 96%)'.format(HUE);
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	gridOffsetX -= Math.cos(SCROLL_ANGLE) * SCROLL_SPEED;
	gridOffsetY -= Math.sin(SCROLL_ANGLE) * SCROLL_SPEED;
	while (gridOffsetX < 0) {
		gridOffsetX += SPACING * Math.cos(GRID_ANGLE);
		gridOffsetY += SPACING * Math.sin(GRID_ANGLE);
	}
	while (gridOffsetX > SPACING) {
		gridOffsetX -= SPACING * Math.cos(GRID_ANGLE);
		gridOffsetY -= SPACING * Math.sin(GRID_ANGLE);
	}
	while (gridOffsetY < 0) {
		gridOffsetX -= SPACING * Math.sin(GRID_ANGLE);
		gridOffsetY += SPACING * Math.cos(GRID_ANGLE);
	}
	while (gridOffsetY > SPACING) {
		gridOffsetX += SPACING * Math.sin(GRID_ANGLE);
		gridOffsetY -= SPACING * Math.cos(GRID_ANGLE);
	}
	
	drawGrid();
	for (let polyomino of polyominos) {
		polyomino.update();
		polyomino.draw();
	}
}