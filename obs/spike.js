const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
ctx.textBaseline = 'middle';
const imgScribbles = document.getElementById('imgScribbles');
const imgTrophies = document.getElementById('imgTrophies');
const streamerName = new URLSearchParams(window.location.search).get('streamer') || 'aspiringspike';
const key = new URLSearchParams(window.location.search).get('key');

const COLOR_BG = '#344256';
const COLOR_SHADOW = '#0000004A';
const SHADOW_ALPHA = 0x4A / 0xFF;
const COLOR_TEXT = '#EEF8FD';
const COLOR_TEXT_SPECIAL = '#B7D8FF';
const LERP_T = .1;
const HEADER_HEIGHT = canvas.height * .285;
const HEADER_TEXT_SIZE = HEADER_HEIGHT / 3;
const ROW_COUNT = 5;
const ROW_HEIGHT = (canvas.height - HEADER_HEIGHT) / ROW_COUNT;
const ROW_SCALE_LARGE = .9;
const ROW_SCALE_SMALL = .8;
const ROW_NAME_SCALE = .8;
const ROW_N_OTHERS_SCALE = .5;
const ROW_SPAWN_Y = canvas.height * 1.25;
const SHADOW_OFFSET = canvas.height * .0125;
const SCRIBBLE_GRID_SPAN = 3;
const SCRIBBLE_ANGLE = 8 * Math.PI / 9;
const SCRIBBLE_COS = Math.cos(SCRIBBLE_ANGLE);
const SCRIBBLE_SIN = Math.sin(SCRIBBLE_ANGLE);
const SCRIBBLE_GRID_ANGLE = -Math.PI / 8;
const SCRIBBLE_GRID_COS = Math.cos(SCRIBBLE_GRID_ANGLE);
const SCRIBBLE_GRID_SIN = Math.sin(SCRIBBLE_GRID_ANGLE);
const SCRIBBLE_DISTANCE = canvas.height * .575;
const SCRIBBLE_SPEED = canvas.height * .001;
const SCRIBBLE_ANIM_SPEED = 40;

// ----------------------------------------
// CLASSES
// ----------------------------------------

class Title {
	constructor() {
		this.x = 0;
	}
	
	update() {
		
	}
	
	draw() {
		let midX = canvas.width / 2;
		let midY = HEADER_HEIGHT / 2;
		midY += HEADER_TEXT_SIZE * .33; // middle textBaseline isn't quite centered.
		ctx.textAlign = 'center';
		ctx.font = HEADER_TEXT_SIZE + 'px Changa';
		ctx.fillStyle = COLOR_SHADOW;
		ctx.fillText("MODERN LEAGUE", midX, midY - HEADER_TEXT_SIZE / 2 + SHADOW_OFFSET);
		ctx.fillText("TROPHY LEADERBOARD", midX, midY + HEADER_TEXT_SIZE / 2 + SHADOW_OFFSET);
		ctx.fillStyle = COLOR_TEXT;
		ctx.fillText("MODERN LEAGUE", midX, midY - HEADER_TEXT_SIZE / 2);
		ctx.fillText("TROPHY LEADERBOARD", midX, midY + HEADER_TEXT_SIZE / 2);
	}
}

class Row {
	constructor(index, name, trophies, place, nOthers) {
		this.index = index;
		this.name = name;
		this.trophies = trophies;
		this.place = place;
		this.nOthers = nOthers;
		this.y = ROW_SPAWN_Y;
		this.scale = ROW_SCALE_SMALL;
		this.color = name.toLowerCase() === streamerName ? COLOR_TEXT_SPECIAL : COLOR_TEXT;
	}
	updateValues(index, trophies, place, nOthers) {
		this.index = index;
		this.trophies = trophies;
		this.place = place;
		this.nOthers = nOthers;
	}
	startDestroying() {
		this.destroying = true;
	}
	
	layout() {
		this.scale = Math.lerp(this.scale, this.place === 0 ? ROW_SCALE_LARGE : ROW_SCALE_SMALL, LERP_T);
	}
	
	update() {
		let aboveRowsHeight = rows.filter(r => !r.destroying && r.index < this.index).reduce((acc, v) => acc + v.height, 0);
		let totalRowsHeight = rows.filter(r => !r.destroying).reduce((acc, v) => acc + v.height, 0);
		let midY = (canvas.height + HEADER_HEIGHT) / 2;
		let targetY = this.destroying ? ROW_SPAWN_Y : midY - totalRowsHeight / 2 + aboveRowsHeight + ROW_HEIGHT * .1;
		this.y = Math.lerp(this.y, targetY, LERP_T);
	}
	
	draw() {
		let leftX = canvas.width * (1 - this.scale) / 2;
		let nameSize = ROW_HEIGHT * this.scale * ROW_NAME_SCALE;
		let trophySize = nameSize * 1.33;
		ctx.font = nameSize + 'px Calistoga';
		let measure = ctx.measureText(this.name);
		let scaleFactor = Math.min(1, canvas.width * this.scale * .66 / measure.width);
		nameSize *= scaleFactor;
		ctx.font = nameSize + 'px Calistoga';
		// Draw trophy.
		let trophyX = leftX + trophySize / 2;
		if (this.place <= 2) {
			ctx.globalAlpha = SHADOW_ALPHA;
			ctx.drawImage(imgTrophies, this.place * 64, 64, 64, 64, trophyX - trophySize / 2, this.y - trophySize / 2 + SHADOW_OFFSET, trophySize, trophySize);
			ctx.globalAlpha = 1;
			ctx.drawImage(imgTrophies, this.place * 64, 0, 64, 64, trophyX - trophySize / 2, this.y - trophySize / 2, trophySize, trophySize);
		}
		let textX = trophyX + trophySize * .66;
		let textY = this.y + nameSize * .066; // middle textBaseline isn't quite centered.
		// Draw name.
		ctx.textAlign = 'left';
		ctx.fillStyle = COLOR_SHADOW;
		ctx.fillText(this.name, textX, textY + SHADOW_OFFSET);
		ctx.fillStyle = this.color;
		ctx.fillText(this.name, textX, textY);
		// Draw "and N others" text.
		if (this.nOthers) {
			let nOthersString = 'and ' + this.nOthers + (this.nOthers === 1 ? ' other' : ' others');
			let nOthersX = textX + nameSize;
			let nOthersY = textY + nameSize * ROW_N_OTHERS_SCALE * 1.2;
			ctx.font = nameSize * ROW_N_OTHERS_SCALE + 'px Calistoga';
			ctx.fillStyle = COLOR_SHADOW;
			ctx.fillText(nOthersString, nOthersX, nOthersY + SHADOW_OFFSET);
			ctx.fillStyle = COLOR_TEXT;
			ctx.fillText(nOthersString, nOthersX, nOthersY);
		}
		// Draw trophy count.
		let trophyTextX = canvas.width - leftX;
		ctx.textAlign = 'right';
		let trophyTextSize = ROW_HEIGHT * this.scale * ROW_NAME_SCALE * 1.2;
		ctx.font = trophyTextSize + 'px Calistoga';
		ctx.fillStyle = COLOR_SHADOW;
		ctx.fillText(this.trophies, trophyTextX, textY + SHADOW_OFFSET);
		ctx.fillStyle = this.color;
		ctx.fillText(this.trophies, trophyTextX, textY);
	}
	
	get height() {
		return ROW_HEIGHT * this.scale;
	}
}

class Scribble {
	static frame = 0;
	static i = 0;
	
	constructor(x, y) {
		let i = Scribble.i;
		Scribble.i = (Scribble.i + 1) % 12;
		this.px = (i % 6) * 128;
		this.py = Math.floor(i / 6) * 128;
		let gridAngle = SCRIBBLE_ANGLE - Math.PI / 4;
		this.x = x * SCRIBBLE_GRID_COS + y * SCRIBBLE_GRID_SIN;
		this.y = -x * SCRIBBLE_GRID_SIN + y * SCRIBBLE_GRID_COS;
		this.x *= SCRIBBLE_DISTANCE;
		this.y *= SCRIBBLE_DISTANCE;
		this.x += canvas.width / 2;
		this.y += canvas.height / 2;
	}
	
	update() {
		this.x += SCRIBBLE_COS * SCRIBBLE_SPEED;
		this.y += SCRIBBLE_SIN * SCRIBBLE_SPEED;
		if (this.x < -200) {
			this.x += (SCRIBBLE_GRID_SPAN * 2 + 1) * SCRIBBLE_GRID_COS * SCRIBBLE_DISTANCE;
			this.y -= (SCRIBBLE_GRID_SPAN * 2 + 1) * SCRIBBLE_GRID_SIN * SCRIBBLE_DISTANCE;
		}
		if (this.y > canvas.height + 200) {
			this.x -= (SCRIBBLE_GRID_SPAN * 2 + 1) * SCRIBBLE_GRID_SIN * SCRIBBLE_DISTANCE;
			this.y -= (SCRIBBLE_GRID_SPAN * 2 + 1) * SCRIBBLE_GRID_COS * SCRIBBLE_DISTANCE;
		}
	}
	draw() {
		let py = this.py;
		if (Scribble.frame < SCRIBBLE_ANIM_SPEED) {
			py += 256;
		}
		ctx.drawImage(imgScribbles, this.px, py, 128, 128, this.x, this.y, 128, 128);
	}
}

// ----------------------------------------
// VARS
// ----------------------------------------

let title = new Title();
let rows = [];
let lastGist = undefined;
let lastGistDate = undefined;
let gistQueue = [];
let scribbles = [];
for (let x = -SCRIBBLE_GRID_SPAN; x <= SCRIBBLE_GRID_SPAN; x++) {
	for (let y = -SCRIBBLE_GRID_SPAN; y <= SCRIBBLE_GRID_SPAN; y++) {
		scribbles.push(new Scribble(x, y));
	}
}

// ----------------------------------------
// FUNCTIONS
// ----------------------------------------

function loop() {
	window.requestAnimationFrame(loop);
	Scribble.frame = (Scribble.frame + 1) % (SCRIBBLE_ANIM_SPEED * 2);
	updateRowsFromQueue();
	clear();
	for (let scribble of scribbles) {
		scribble.update();
		scribble.draw();
	}
	for (let row of rows) {
		row.layout();
	}
	for (let row of rows) {
		row.update();
	}
	rows = rows.filter(r => !r.destroying || r.y < ROW_SPAWN_Y * .99);
	for (let row of rows) {
		row.draw();
	}
	title.update();
	title.draw();
}
loop();

function clear() {
	ctx.fillStyle = COLOR_BG;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function updateRowsFromQueue() {
	if (gistQueue.length == 0) {
		return;
	}
	let lines = gistQueue.shift().trim().split('\n');
	let tuples = [];
	// Flip each score region upside down, but make sure streamerName is on top.
	let regionIndex = undefined;
	let regionValue = undefined;
	for (let [index, line] of lines.entries()) {
		let tokens = line.split('|');
		let name = tokens[0];
		let trophies = parseInt(tokens[1]);
		if (trophies !== regionValue) {
			regionIndex = index;
			regionValue = trophies;
		}
		let tuple = [name, trophies];
		tuples.splice(regionIndex, 0, tuple);
		if (name === streamerName) {
			regionIndex++;
		}
	}
	let nOthers = truncateTuples(tuples);
	// Create/update/remove rows.
	let toDelete = new Set(rows);
	let place = 0;
	let placeValue = tuples[0][1];
	for (let [index, tuple] of tuples.entries()) {
		if (tuple[1] < placeValue) {
			place++;
			placeValue = tuple[1];
		}
		let rowNOthers = index === tuples.length - 1 && nOthers !== 0 ? nOthers : '';
		let existingRow = rows.find(row => row.name.toLowerCase() === tuple[0].toLowerCase());
		if (existingRow) {
			existingRow.updateValues(index, tuple[1], place, rowNOthers);
			toDelete.delete(existingRow);
			continue;
		}
		rows.push(new Row(index, tuple[0], tuple[1], place, rowNOthers));
	}
	for (let row of toDelete) {
		row.startDestroying();
	}
}
function truncateTuples(tuples) {
	if (tuples.length <= ROW_COUNT) {
		return 0;
	}
	let nOthers = 0;
	let i = ROW_COUNT;
	let value = tuples[i][1];
	while (i < tuples.length && tuples[i][1] === value) {
		nOthers++;
		i++;
	}
	if (i === tuples.length) {
		nOthers += '+';
	}
	tuples.length = ROW_COUNT;
	return nOthers;
}

function fetchGist() {
	// can also investigate Github's GQL API
	let opt = {method: 'GET', headers:{}};
	opt.headers['Authorization'] = 'Basic ' + btoa('thquinn:' + key);
	if (lastGistDate) {
		opt.headers['If-Modified-Since'] = lastGistDate.toUTCString();
	}
	let requestDate = new Date();
	fetch('https://api.github.com/gists/7fa8e34c354cfce5ed071369f6d0b793', opt)
		.then(r => {
			if (r.status === 304) {
				return null;
			}
			return r.json();
		})
		.then(t => {
			if (t === null) {
				return;
			}
			t = Object.values(t.files)[0].content;
			if (t === lastGist) {
				return;
			}
			lastGist = t;
			gistQueue.push(t);
			lastGistDate = requestDate;
		})
		.catch((e) => {
			console.error('Failed to fetch gist.');
			console.error(e);
		});
}
fetchGist();
setInterval(fetchGist, 5000);

Math.lerp = function (value1, value2, amount) {
  return value1 + (value2 - value1) * amount;
};