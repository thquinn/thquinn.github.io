// TODO
//	- An on-click event
//	- Convert to three.js JSON format
//	- Consolidate libraries

const canvas = document.getElementById('headerCanvas');

THREE.Cache.enabled = true;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 1, 1000);
var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

camera.position.z = 50;
camera.position.y = 18;

var light = new THREE.AmbientLight(0xFFFFFF, 1.75); // soft white light
scene.add(light);

var gel;

var loader = new THREE.GLTFLoader();
loader.load('../../resources/3d/gel.gltf', function (object) {
	gel = object.scene.children[0];
	for (let i = 0; i < gel.children[0].children.length; i++) {
		for (let j = 0; j < 6; j++) {
			gel.children[0].children[i].morphTargetInfluences[j] = 0;
		}
	}

	gel.scale.set(50, 50, 50);
	scene.add(gel);
});
class Interpolator {
	constructor(lowMin, lowMax, highMin, highMax, timeMin, timeMax, lowWaitMin, lowWaitMax, highWaitMin, highWaitMax, eased, startLow, startWait) {
		this.lowMin = lowMin;
		this.lowMax = lowMax;
		this.highMin = highMin;
		this.highMax = highMax;
		this.timeMin = timeMin;
		this.timeMax = timeMax;
		this.lowWaitMin = lowWaitMin;
		this.lowWaitMax = lowWaitMax;
		this.highWaitMin = highWaitMin;
		this.highWaitMax = highWaitMax;
		this.eased = eased;

		this.fromLow = startLow;
		this.value = this.generateValue(!this.fromLow);
		this.from = this.value;
		this.to = this.generateValue(this.fromLow);
		this.t = 0;
		this.tEnd = this.generateTime();
		this.wait = startWait ? this.generateWait() : 0;
	}

	update() {
		if (this.wait > 0) {
			this.wait--;
			return;
		}
		this.t++;
		if (this.t == this.tEnd) {
			this.value = this.to;
			this.from = this.to;
			this.fromLow = !this.fromLow;
			this.to = this.generateValue(this.fromLow);
			this.t = 0;
			this.tEnd = this.generateTime();
			this.wait = this.generateWait();
			return;
		}
		if (this.eased) {
			this.value = Math.easeInOutQuad(this.t, this.from, this.to - this.from, this.tEnd);
		} else {
			this.value = this.from + (this.to - this.from) * (this.t / this.tEnd);
		}
	}

	generateValue(fromLow) {
		let min = fromLow ? this.highMin : this.lowMin;
		let max = fromLow ? this.highMax : this.lowMax;
		return Math.randFloat(min, max);
	}
	generateTime() {
		return Math.randInt(this.timeMin, this.timeMax + 1);
	}
	generateWait() {
		return this.fromLow ? Math.randInt(this.lowWaitMin, this.lowWaitMax + 1) : Math.randInt(this.highWaitMin, this.highWaitMax + 1);
	}
}
var squishInterpolator = new Interpolator(-.25, -.1, .3, .4, 90, 120, 0, 0, 0, 0, true, true, false);
var blinkInterpolator = new Interpolator(0, 0, 1, 1, 3, 3, 200, 300, 0, 0, false, true, true);
var leafInterpolator = new Interpolator(0, .2, .4, .5, 300, 400, 30, 60, 30, 60, true, true, false);
var leanInterpolator = new Interpolator(-.5, -.2, .2, .5, 300, 400, 30, 60, 30, 60, true, true, false);
var turnInterpolator = new Interpolator(-.35, -.35, -.5, -.57, 10, 10, 500, 900, 200, 300, true, true, true);

function loop() {
	window.requestAnimationFrame(loop);
	
	if (gel) {
		squishInterpolator.update();
		blinkInterpolator.update();
		leafInterpolator.update();
		leanInterpolator.update();
		turnInterpolator.update();
		for (let i = 0; i < gel.children[0].children.length; i++) {
			gel.children[0].children[i].morphTargetInfluences[0] = squishInterpolator.value;
			gel.children[0].children[i].morphTargetInfluences[2] = blinkInterpolator.value;
			gel.children[0].children[i].morphTargetInfluences[3] = leafInterpolator.value;
			gel.children[0].children[i].morphTargetInfluences[5] = leanInterpolator.value;
		}
		gel.rotation.y = turnInterpolator.value;
	}

	renderer.render(scene, camera);
}
loop();