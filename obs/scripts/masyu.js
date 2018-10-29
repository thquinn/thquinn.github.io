var canvas = document.getElementById('canvas');

var HUE = Number(urlParams.get('hue') || 203);
var SCROLL_ANGLE = Number(urlParams.get('scroll_angle') || -15) * Math.PI / 180;
var SCROLL_SPEED = Number(urlParams.get('scroll_speed') || 11) * canvas.height / 6000;
var GRID_ANGLE = Number(urlParams.get('grid_angle') || -10) * Math.PI / 180;
var GRID_STROKE = Number(urlParams.get('grid_stroke') || 1) * canvas.height / 160;
var SPACING = Number(urlParams.get('spacing') || 1) * canvas.height / 12;
var POLY_COLOR = urlParams.get('poly_color') || '#3B3E40';

const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
var ctx = canvas.getContext('2d');

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
}