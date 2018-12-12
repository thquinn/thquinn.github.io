const canvas = document.getElementById('canvas');
const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);

var scene = new THREE.Scene();
var camera = new THREE.OrthographicCamera(-canvas.width / 100, canvas.width / 100, canvas.height / 100, -canvas.height / 100, 1, 1000);
camera.position.set(10, 10, 10);
camera.up = new THREE.Vector3(0,0,1);
camera.lookAt(new THREE.Vector3(0,0,0));

var light = new THREE.AmbientLight(0xFFFFFF, .33);
scene.add(light);
var dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
dirLight.position.set(10, -10, 10);
dirLight.lookAt(new THREE.Vector3(-10, 10, -10));
dirLight.castShadow = true;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 1000;
dirLight.shadow.mapSize.width = 1024;  // default
dirLight.shadow.mapSize.height = 1024; // default
scene.add(dirLight);

var cubeGeom = new THREE.BoxGeometry( 1, 1, 1 );
var cubeMat = new THREE.MeshLambertMaterial( {color: 0xffffff} );

for (let x = -10; x <= 10; x++) {
	for (let y = -10; y <= 10; y++) {
		if (Math.random() < .8) {
			continue;
		}
		let cube = new THREE.Mesh(cubeGeom, cubeMat);
		cube.position.set(x, y, 0);
		cube.scale.z = Math.random() * 10;
		cube.castShadow = true;
		cube.receiveShadow = true;
		scene.add(cube);
	}
}

var plane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 1, 1 ), new THREE.MeshLambertMaterial( {color: 0xe0e0e0} ));
plane.receiveShadow = true;
scene.add(plane);

var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: false, antialias: true });
renderer.shadowMap.enabled = true;

var frame = 0;
function loop() {
	frame++;
	window.requestAnimationFrame(loop);
	let theta = frame / 500 * 2 * Math.PI;
	camera.position.set(10 * Math.cos(theta), 10 * Math.sin(theta), 10);
	camera.lookAt(new THREE.Vector3(0,0,0));
	renderer.render(scene, camera);
}