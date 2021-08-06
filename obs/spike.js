const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imgScribbles = document.getElementById('imgScribbles');

let gist = undefined;
let gistTime = undefined;
let i = 0;

function loop() {
	i++;
	window.requestAnimationFrame(loop);
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = '#FFFFFF';
	ctx.font = "50px Calistoga";
	ctx.fillText("Whatever.", 50, 50);
	ctx.font = "50px Changa";
	ctx.fillText("SERIOUSLY.", 50, 100);
	ctx.drawImage(imgScribbles, 128, i % 60 < 30 ? 0 : 256, 128, 128, 100, 100, 128, 128);
}
loop();

function fetchGist() {
	let requestTime = new Date();
	let options = gistTime === undefined ? undefined : {headers: {'If-Modified-Since': gistTime.toUTCString()}};
	fetch('https://gist.githubusercontent.com/thquinn/7fa8e34c354cfce5ed071369f6d0b793/raw', options)
		.then(r => {
			console.log(r.status);
			return r.text();
		})
		.then(t => {
			gist = t;
			gistTime = requestTime;
		})
		.catch((e) => {
			console.error('Failed to fetch gist.');
			console.error(e);
		});
}
fetchGist();