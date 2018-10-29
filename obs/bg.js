const BG_NAMES = new Set(['masyu', 'squares']);
const urlParams = new URLSearchParams(window.location.search);
const bgParam = urlParams.get('bg');
if (BG_NAMES.has(bgParam)) {
	let width = urlParams.get('width') || 1920;
	let height = urlParams.get('height') || 1080;
	let canvas = document.getElementById('canvas');
	canvas.width = width;
	canvas.height = height;
	loadJS( './scripts/' + bgParam + '.js', function() {
		loop();
	});
} else {
	window.location = './gallery.html';
}