import * as THREE from '../vendor/three.js-master/build/three.module.js';
import Stats from '../vendor/three.js-master/examples/jsm/libs/stats.module.js';
import { OrbitControls } from '../vendor/three.js-master/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from '../vendor/three.js-master/examples/jsm/loaders/FBXLoader.js';

const Scene = {
	vars: {
		container: null,
		scene: null,
		renderer: null,
		camera: null,
		stats: null,
		controls: null,
		texture: null,
		sound: null,
		mouse: new THREE.Vector2(),
		raycaster: new THREE.Raycaster(),
		animSpeed: null,
		doorOpened: false,
		animPercent: 0.00,
		text: "DAWIN",
		wall_inside: []
	},
	animate: () => {
		requestAnimationFrame(Scene.animate);
		Scene.vars.raycaster.setFromCamera(Scene.vars.mouse, Scene.vars.camera);

		Scene.customAnimation();

		if (Scene.vars.doorGroup !== undefined && Scene.vars.door2Group !== undefined && Scene.vars.door3Group !== undefined) {

			let intersects1 = Scene.vars.raycaster.intersectObjects(Scene.vars.doorGroup.children, true);
			let intersects2 = Scene.vars.raycaster.intersectObjects(Scene.vars.door2Group.children, true);
			let intersects3 = Scene.vars.raycaster.intersectObjects(Scene.vars.door3Group.children, true);

			if (intersects1.length > 0) {
				Scene.intersectDoor(Scene.vars.doorGroup);
				Scene.vars.animSpeed = 0.05;
			} else if (intersects2.length > 0) {
				Scene.intersectDoor(Scene.vars.door2Group);
				Scene.vars.animSpeed = 0.05;
			} else if (intersects3.length > 0) {
				Scene.intersectDoor(Scene.vars.door3Group);
				Scene.vars.animSpeed = 0.05;
			} else {
				
				Scene.vars.animSpeed = -0.05;
			}
		}

		Scene.render();
	},
	render: () => {
		Scene.vars.renderer.render(Scene.vars.scene, Scene.vars.camera);
		Scene.vars.stats.update();
	},
	customAnimation: () => {
		let vars = Scene.vars;

		if (vars.animSpeed === null) {
			return;
		}

		vars.animPercent = vars.animPercent + vars.animSpeed;

		if (vars.animPercent < 0) {
			vars.animPercent = 0;
			return;
		}
		if (vars.animPercent > 1) {
			vars.animPercent = 1;
			return;
		}

	},
	intersectDoor: (group) => {
		group.children[0].traverse(node => {
			if (node.isMesh) {
				if (node.name == "Circle002") {
					if(node.rotation.y > -0.75) {
						node.rotation.y = -3 * Scene.vars.animPercent;
					}
				}
			}
		});
	},
	loadFBX: (file, scale, position, rotation, color, namespace, callback) => {
		let vars = Scene.vars;
		let loader = new FBXLoader();

		if (file === undefined) {
			return;
		}

		loader.load('./fbx/' + file, (object) => {

			object.traverse((child) => {
				if (child.isMesh) {

					child.castShadow = true;
					child.receiveShadow = true;

					if (namespace === "door") {
						child.material = new THREE.MeshBasicMaterial({
							map: new THREE.TextureLoader().load('./texture/Door_C.jpg'),
						});
					}

					child.material.color = new THREE.Color(color);
				}
			});

			object.position.x = position[0];
			object.position.y = position[1];
			object.position.z = position[2];

			object.rotation.x = rotation[0];
			object.rotation.y = rotation[1];
			object.rotation.z = rotation[2];

			object.scale.x = object.scale.y = object.scale.z = scale;
			Scene.vars[namespace] = object;

			callback();
		});

	},
	loadText: (text, scale, position, rotation, color, namespace, callback) => {
		let loader = new THREE.FontLoader();

		if (text === undefined || text === "") {
			return;
		}

		loader.load('./vendor/three.js-master/examples/fonts/helvetiker_regular.typeface.json', (font) => {
			let geometry = new THREE.TextGeometry(text, {
				font,
				size: 1,
				height: 0.1,
				curveSegments: 1,
				bevelEnabled: false
			});

			geometry.computeBoundingBox();
			let offset = geometry.boundingBox.getCenter().negate();
			geometry.translate(offset.x, offset.y, offset.z);

			let material = new THREE.MeshBasicMaterial({
				color: new THREE.Color(color)
			});

			let mesh = new THREE.Mesh(geometry, material);

			mesh.position.x = position[0];
			mesh.position.y = position[1];
			mesh.position.z = position[2];

			mesh.rotation.x = rotation[0];
			mesh.rotation.y = rotation[1];
			mesh.rotation.z = rotation[2];

			mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;

			Scene.vars[namespace] = mesh;

			callback();
		});
	},
	onWindowResize: () => {
		let vars = Scene.vars;
		vars.camera.aspect = window.innerWidth / window.innerHeight;
		vars.camera.updateProjectionMatrix();
		vars.renderer.setSize(window.innerWidth, window.innerHeight);
	},
	onMouseMove: (event) => {
		Scene.vars.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		Scene.vars.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	},
	onMouseDown: (event) => {
		Scene.vars.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		Scene.vars.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

		var listener = new THREE.AudioListener();
		Scene.vars.camera.add(listener);

		var sound = new THREE.Audio(listener);
		var audioLoader = new THREE.AudioLoader();

		Scene.vars.raycaster.setFromCamera(Scene.vars.mouse, Scene.vars.camera);

		if (Scene.vars.doorGroup !== undefined) {
			let intersects = Scene.vars.raycaster.intersectObjects(Scene.vars.doorGroup.children, true);
			if (intersects.length > 0) {
				if (!Scene.vars.doorOpened) {
					Scene.vars.doorGroup.children[0].traverse(node => {
						if (node.isMesh) {
							if (node.name == "Plane001") {
								node.rotation.z = 30;
							}
						}
					});
					audioLoader.load('sound/open_door_3.mp3', function (buffer) {
						sound.setBuffer(buffer);
						sound.setVolume(0.5);
						sound.play();
					});
					Scene.vars.doorOpened = true;
				} else {
					Scene.vars.doorGroup.children[0].traverse(node => {
						if (node.isMesh) {
							if (node.name == "Plane001") {
								node.rotation.z = 0;
							}
						}
					});
					audioLoader.load('sound/close_door_1.mp3', function (buffer) {
						sound.setBuffer(buffer);
						sound.setVolume(0.7);
						sound.play();
					});
					Scene.vars.doorOpened = false;
				}
			}
		}

		Scene.render();
	},
	init: () => {
		let vars = Scene.vars;

		// Préparer le container pour la scène
		vars.container = document.createElement('div');
		vars.container.classList.add('fullscreen');
		document.body.appendChild(vars.container);

		// ajout de la scène
		vars.scene = new THREE.Scene();
		vars.scene.background = new THREE.Color(0xa0a0a0);
		vars.scene.fog = new THREE.Fog(vars.scene.background, 500, 3000);

		// paramétrage du moteur de rendu
		vars.renderer = new THREE.WebGLRenderer({ antialias: true });
		vars.renderer.setPixelRatio(window.devicePixelRatio);
		vars.renderer.setSize(window.innerWidth, window.innerHeight);

		vars.renderer.shadowMap.enabled = true;
		vars.renderer.shadowMapSoft = true;

		vars.container.appendChild(vars.renderer.domElement);

		// ajout de la caméra
		vars.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
		vars.camera.position.set(-1.5, 210, 572);

		// ajout de la lumière
		const lightIntensityHemisphere = .5;
		let light = new THREE.HemisphereLight(0xFFFFFF, 0x444444, lightIntensityHemisphere);
		light.position.set(0, 700, 0);
		vars.scene.add(light);

		// ajout des directionelles
		const lightIntensity = .8;
		const d = 1000;
		let light1 = new THREE.DirectionalLight(0xFFFFFF, lightIntensity);
		light1.position.set(0, 700, 0);
		light1.castShadow = true;
		light1.shadow.camera.left = -d;
		light1.shadow.camera.right = d;
		light1.shadow.camera.top = d;
		light1.shadow.camera.bottom = -d;
		light1.shadow.camera.far = 2000;
		light1.shadow.mapSize.width = 4096;
		light1.shadow.mapSize.height = 4096;
		vars.scene.add(light1);
		// let helper = new THREE.DirectionalLightHelper(light1, 5);
		// vars.scene.add(helper);

		let light2 = new THREE.DirectionalLight(0xFFFFFF, lightIntensity);
		light2.position.set(-400, 200, 400);
		light2.castShadow = true;
		light2.shadow.camera.left = -d;
		light2.shadow.camera.right = d;
		light2.shadow.camera.top = d;
		light2.shadow.camera.bottom = -d;
		light2.shadow.camera.far = 2000;
		light2.shadow.mapSize.width = 4096;
		light2.shadow.mapSize.height = 4096;
		vars.scene.add(light2);
		// let helper2 = new THREE.DirectionalLightHelper(light2, 5);
		// vars.scene.add(helper2);

		let light3 = new THREE.DirectionalLight(0xFFFFFF, lightIntensity);
		light3.position.set(400, 200, 400);
		light3.castShadow = true;
		light3.shadow.camera.left = -d;
		light3.shadow.camera.right = d;
		light3.shadow.camera.top = d;
		light3.shadow.camera.bottom = -d;
		light3.shadow.camera.far = 2000;
		light3.shadow.mapSize.width = 4096;
		light3.shadow.mapSize.height = 4096;
		vars.scene.add(light3);
		// let helper3 = new THREE.DirectionalLightHelper(light3, 5);
		// vars.scene.add(helper3);

		// ajout du sol
		let mesh = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(2000, 2000),
			new THREE.MeshLambertMaterial(
				{ color: new THREE.Color(0x888888) }
			)
		);
		mesh.rotation.x = -Math.PI / 2;
		mesh.receiveShadow = false;
		vars.scene.add(mesh);

		let planeMaterial = new THREE.ShadowMaterial();
		planeMaterial.opacity = 0.07;
		let shadowPlane = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(2000, 2000),
			planeMaterial);
		shadowPlane.rotation.x = -Math.PI / 2;
		shadowPlane.receiveShadow = true;

		vars.scene.add(shadowPlane);

		// ajout de la texture helper du sol
		// let grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
		// grid.material.opacity = 0.2;
		// grid.material.transparent = true;
		// vars.scene.add(grid);

		// ajout de la sphère
		let geometry = new THREE.SphereGeometry(1000, 32, 32);
		let material = new THREE.MeshPhongMaterial({ color: new THREE.Color(0xFFFFFF) });
		material.side = THREE.DoubleSide;
		let sphere = new THREE.Mesh(geometry, material);
		vars.scene.add(sphere);

		let hash = document.location.hash.substr(1);
		if (hash.length !== 0) {
			let text = hash.substring();
			Scene.vars.text = decodeURI(text);
		}

		Scene.loadFBX("door.fbx", 10, [0, 0, 0], [0, 0, 0], 0xFFFFFF, 'door', () => {
			let vars = Scene.vars;
			let door = new THREE.Group();
			door.add(vars.door);
			door.children[0].traverse(node => {
				if (node.isMesh) {
					console.log(node);
					if (node.name == "Plane002") {
						node.scale.set(9, 9, 9);
						node.castShadow = true;
						node.receiveShadow = true;
					}
				}
			});

			vars.scene.add(door);
			vars.doorGroup = door;

			let door2 = door.clone();
			door2.position.set(-200, 0, 0);

			vars.scene.add(door2);
			vars.door2Group = door2;

			let door3 = door.clone();
			door3.position.set(200, 0, 0);

			vars.scene.add(door3);
			vars.door3Group = door3;

			let elem = document.querySelector('#loading');
			elem.parentNode.removeChild(elem);
		});

		var wall_inside = {
			width: 600,
			height: 200,
			depth: 10
		}
		var wall_geo = new THREE.CubeGeometry(wall_inside.width, wall_inside.height, wall_inside.depth);

		var txt_wall = new THREE.TextureLoader().load('texture/wall.jpg', function(txt_wall) {
			txt_wall.wrapS = txt_wall.wrapT = THREE.RepeatWrapping;
			txt_wall.offset.set( 0, 0 );
			txt_wall.repeat.set( 1, 1 );
		});
		let material2 = new THREE.MeshLambertMaterial({
			map: txt_wall
		});

		let mesh2 = new THREE.Mesh(wall_geo, material2);
		vars.scene.add(mesh2);

		mesh2.castShadow = true;

		mesh2.position.x = 0;
		mesh2.position.y = 100;

		// ajout des controles
		vars.controls = new OrbitControls(vars.camera, vars.renderer.domElement);
		vars.controls.minDistance = 300;
		vars.controls.maxDistance = 600;
		vars.controls.minPolarAngle = Math.PI / 4;
		vars.controls.maxPolarAngle = Math.PI / 2;
		vars.controls.minAzimuthAngle = - Math.PI / 4;
		vars.controls.maxAzimuthAngle = Math.PI / 4;
		vars.controls.target.set(0, 100, 0);
		vars.controls.update();

		window.addEventListener('resize', Scene.onWindowResize, false);
		window.addEventListener('mousemove', Scene.onMouseMove, false);
		window.addEventListener('mousedown', Scene.onMouseDown, false);

		vars.stats = new Stats();
		vars.container.appendChild(vars.stats.dom);
		Scene.animate();
	}
};

Scene.init();

