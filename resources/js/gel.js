// Requires https://rawgit.com/mrdoob/three.js/master/examples/js/loaders/GLTFLoader.js, folded into the minified version

Math.randFloat = function (min, max) {
	return Math.random() * (max - min) + min;
};
Math.randInt = function (min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};
// from http://www.gizma.com/easing/
Math.easeInOutQuad = function (t, b, c, d) {
  t /= d/2;
  if (t < 1) return c/2*t*t + b;
  t--;
  return -c/2 * (t*(t-2) - 1) + b;
};

const gelCanvas = document.getElementById('headerCanvas');
gelCanvas.style.opacity = 0;

THREE.Cache.enabled = true;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, gelCanvas.width / gelCanvas.height, 1, 1000);
var renderer = new THREE.WebGLRenderer({ canvas: gelCanvas, alpha: true, antialias: true });
function resize() {
	gelCanvas.width = gelCanvas.parentNode.offsetHeight;
	gelCanvas.height = gelCanvas.parentNode.offsetHeight;
	renderer.setSize(gelCanvas.parentNode.offsetHeight, gelCanvas.parentNode.offsetHeight);
	camera.aspect = gelCanvas.offsetHeight / gelCanvas.offsetHeight;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

camera.position.z = 50;
camera.position.y = 16;

var light = new THREE.AmbientLight(0xFFFFFF, 1.75);
scene.add(light);
var light2 = new THREE.PointLight(0xFFFFFF, .5, 0);
light2.position.set(150, 150, 150);
scene.add(light2);
const geometry = new THREE.CircleGeometry(11, 16);
const material = new THREE.MeshBasicMaterial({ color: 0xE0E0E0 });
var shadow = new THREE.Mesh(geometry, material);
shadow.translateY(-2);
shadow.translateZ(-4.5);
shadow.rotateX(-1.8);
scene.add(shadow);

var gel;

var loader = new THREE.GLTFLoader();
loader.load('https://thquinn.github.io/resources/3d/gel.gltf', function (object) {
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
var squishInterpolator = new Interpolator(-.25, -.15, .15, .2, 150, 180, 0, 0, 0, 0, true, true, false);
var blinkInterpolator = new Interpolator(0, 0, 1, 1, 3, 3, 45, 300, 0, 0, false, true, true);
var leafInterpolator = new Interpolator(.4, .5, .15, .25, 300, 400, 30, 60, 30, 60, true, true, false);
var leanInterpolator = new Interpolator(-.7, -.2, .2, .5, 300, 400, 30, 60, 30, 60, true, true, false);
var turnInterpolator = new Interpolator(-.35, -.35, -.5, -.57, 10, 10, 500, 900, 200, 300, true, true, true);
var interpolators = [squishInterpolator, blinkInterpolator, leafInterpolator, leanInterpolator, turnInterpolator];
var cringeTimer = 0, cringe = 0;
gelCanvas.addEventListener('click', function(e) {
	if (cringe == 0)
		cringeTimer = 1;
	e.preventDefault();
});

function gelLoop() {
	window.requestAnimationFrame(gelLoop);
	
	if (gel) {
		let opacity = parseFloat(gelCanvas.style.opacity);
		if (opacity < 1) {
			gelCanvas.style.opacity = Math.min(1, opacity + .033);
		}

		if (cringeTimer > 0) {
			if (cringeTimer > 180) {
				cringeTimer = 0;
			} else {
				cringeTimer++;
				cringe = Math.min(1, cringeTimer / 4);
			}
		} else if (cringe > 0) {
			cringe = Math.max(0, cringe - .01);
		}

		if (cringe == 0) {
			for (let interpolator of interpolators) {
				interpolator.update();
			}
		}
		let easedCringe = Math.easeInOutQuad(cringe, 0, .92, 1);
		let values = [
			easedCringe * 1.25 + squishInterpolator.value * (1 - easedCringe),
			easedCringe * .65 + blinkInterpolator.value * (1 - easedCringe),
			easedCringe * 0 + leafInterpolator.value * (1 - easedCringe),
			easedCringe * 0 + leanInterpolator.value * (1 - easedCringe),
			turnInterpolator.value,
		];

		for (let i = 0; i < gel.children[0].children.length; i++) {
			gel.children[0].children[i].morphTargetInfluences[0] = values[0];
			gel.children[0].children[i].morphTargetInfluences[2] = values[1];
			gel.children[0].children[i].morphTargetInfluences[3] = values[2];
			gel.children[0].children[i].morphTargetInfluences[5] = values[3];
		}
		gel.position.x = cringe == 1 ? Math.randFloat(-.25, .25) : 0;
		gel.rotation.y = values[4];

		let shadowScale = 1 + values[0] * .15;
		shadow.scale.set(shadowScale, shadowScale, shadowScale);
	}

	renderer.render(scene, camera);
}
gelLoop();