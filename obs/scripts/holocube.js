// based on the vfx going on in the background here: https://youtu.be/b5o6RzwDN0w?t=387

const canvas = document.getElementById('canvas');
const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);

var ctx = canvas.getContext('2d');

class Cube {
	constructor() {
		this.vertices = [];
		for (let x of [-1, 1]) {
			for (let y of [-1, 1]) {
				for (let z of [-1, 1]) {
					this.vertices.push([x, y, z]);
				}
			}
		}
		this.faces = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
		// TODO: quaternion rotation
		this.rotation = [Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI];
		this.scale = 500;
	}

	draw() {
		let rotVert = this.rotated_vertices();
		for (let face of this.faces) {
			// Create face path.
			ctx.beginPath();
			ctx.moveTo(canvas.width / 2 + rotVert[face[0]][0] * this.scale, canvas.height / 2 + rotVert[face[0]][1] * this.scale);
			for (let i = 1; i < face.length; i++) {
				ctx.lineTo(canvas.width / 2 + rotVert[face[i]][0] * this.scale, canvas.height / 2 + rotVert[face[i]][1] * this.scale);
			}
			ctx.closePath();
			// Draw a linear gradient across each edge of the face.
			for (let i = 0; i < face.length; i++) {
				let x1 = rotVert[face[i]][0];
				let x2 = rotVert[face[(i + 1) % face.length]][0];
				let x3 = rotVert[face[(i + 2) % face.length]][0];
				let y1 = rotVert[face[i]][1];
				let y2 = rotVert[face[(i + 1) % face.length]][1];
				let y3 = rotVert[face[(i + 2) % face.length]][1];
				let midX = (x1 + x2) / 2;
				let midY = (y1 + y2) / 2;
				let angle = Math.atan2(y1 - y2, x1 - x2) + Math.PI / 2;
				angle = closerAngle(midX, midY, angle, x3, y3);
				// TODO: shorten gradients based on tilt of face
				let targetX = midX + Math.cos(angle) * .4;
				let targetY = midY + Math.sin(angle) * .4;
				midX = canvas.width / 2 + midX * this.scale;
				midY = canvas.height / 2 + midY * this.scale;
				targetX = canvas.width / 2 + targetX * this.scale;
				targetY = canvas.height / 2 + targetY * this.scale;

				let gradient = ctx.createLinearGradient(midX, midY, targetX, targetY);
				gradient.addColorStop(0, 'hsla(110, 50%, 50%, 0.1)');
				gradient.addColorStop(1, 'hsla(110, 50%, 50%, 0.0)');
				ctx.fillStyle = gradient;
				ctx.fill();
				ctx.lineWidth = 2;
				ctx.shadowBlur = 20;
				ctx.shadowColor = 'hsl(110, 50%, 50%)';
				// TODO: just draw each edge once; stroking each face is drawing each edge twice.
				ctx.stroke();
				ctx.shadowBlur = 0;
			}
		}
	}
	rotated_vertices() {
		let rotx = [[1, 0, 0], [0, Math.cos(this.rotation[0]), -Math.sin(this.rotation[0])], [0, Math.sin(this.rotation[0]), Math.cos(this.rotation[0])]];
		let roty = [[Math.cos(this.rotation[1]), 0, Math.sin(this.rotation[1])], [0, 1, 0], [-Math.sin(this.rotation[1]), 0, Math.cos(this.rotation[1])]];
        let rotz = [[Math.cos(this.rotation[2]), -Math.sin(this.rotation[2]), 0], [Math.sin(this.rotation[2]), Math.cos(this.rotation[2]), 0], [0, 0, 1]];
		return math.multiply(this.vertices, rotx, roty, rotz);
	}
}
function closerAngle(x, y, angle, x2, y2) {
	let x3 = x + Math.cos(angle);
	let x4 = x + Math.cos(angle + Math.PI);
	let y3 = y + Math.sin(angle);
	let y4 = y + Math.sin(angle + Math.PI);
	let dist3Squared = (x3 - x2) ** 2 + (y3 - y2) ** 2;
	let dist4Squared = (x4 - x2) ** 2 + (y4 - y2) ** 2;
	return dist3Squared <= dist4Squared ? angle : angle + Math.PI;
}

var cube = new Cube();
function loop() {
	window.requestAnimationFrame(loop);
	ctx.fillStyle = 'hsl(110, 10%, 10%)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.strokeStyle = 'hsl(110, 50%, 50%)';
	ctx.lineJoin = 'bevel';
	ctx.lineWidth = canvas.height / 100;
	cube.rotation[0] += .001;
	cube.rotation[1] += .002;
	cube.rotation[2] += .003;
	cube.draw();
}