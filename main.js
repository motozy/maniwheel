var lastX = 0;
var lastY = 0;
var currentX = 0;
var currentY = 0;
var holding = false;
var lastTimestamp = 0;
var currentSpeed = 0;

function prepareCanvasContainer()
{
      var container = document.getElementById("container");
      var width = 1;
      var height = 1;
      
      function resizeCanvasContainer()
      {
            width = window.innerWidth;
            height = window.innerHeight;

            var maxWidth = height * 0.75;
            var left = 0;
            if(width > maxWidth){
                  left = (width - maxWidth) / 2;
                  width = maxWidth;
            }
            container.style.left = left + "px";
            container.style.width = width + "px";

            var canvas = document.getElementById("canvas");
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
      }

      window.addEventListener("resize", function(event) {
            resizeCanvasContainer();
      }, false);
      resizeCanvasContainer();

      container.addEventListener("touchstart", function(event) {
            const touches = event.changedTouches;
            lastX = touches[0].pageX / width;
            lastY = touches[0].pageY / height;
            currentX = lastX;
            currentY = lastY;
            holding = true;
      }, false);
      container.addEventListener("touchmove", function(event) {
            const touches = event.changedTouches;
            currentX = touches[0].pageX / width;
            currentY = touches[0].pageY / height;
      }, false);
      container.addEventListener("touchend", function(event) {
            holding = false;
      }, false);
      container.addEventListener("touchcancel", function(event) {
            holding = false;
      }, false);
      container.addEventListener("mousedown", function(event) {
            lastX = event.clientX / width;
            lastY = event.clientY / height;
            currentX = lastX;
            currentY = lastY;
            holding = true;
      }, false);
      container.addEventListener("mousemove", function(event) {
            currentX = event.clientX / width;
            currentY = event.clientY / height;
      }, false);
      container.addEventListener("mouseup", function(event) {
            holding = false;
      }, false);

      // iOSでのスクロール禁止
      window.addEventListener("touchmove", function(event) {
            if (event.target === container) {
                  event.stopPropagation();
            } else {
                  event.preventDefault();
            }
      });
}

function prepareCanvas(texture)
{
      // canvasサイズ設定
      var canvas = document.getElementById("canvas");
      canvas.width = 256;
      canvas.height = 512;

      // Renderer
      var renderer = new THREE.WebGLRenderer( { 'canvas' : canvas } );

      // Camera
      var camera = new THREE.PerspectiveCamera();
      camera.position.z = 200;

      // マニ車本体
      var geometry = new THREE.CylinderGeometry(80, 80, 100, 32);
      var material = new THREE.MeshPhongMaterial( {  map: texture["map"], bumpMap: texture["bumpMap"] } );
      var mesh = new THREE.Mesh( geometry, material );
      
      // 絵恋ちゃんパーティクル
      var particles;
      var particleMaterial;
      {
            const particleGeometry = new THREE.Geometry();
            for (let i = 0; i < 256; i++) {
                  particleGeometry.vertices.push(new THREE.Vector3(
                        (Math.random() - 0.5),
                        (Math.random() - 0.5),
                        (Math.random() - 0.5),
                  ));
            }
            particleMaterial = new THREE.PointCloudMaterial({
                  map: texture["erenchan"],
                  size: 32,
                  blending: THREE.AdditiveBlending,
                  transparent: true
                });
            particles = new THREE.Points(particleGeometry, particleMaterial);
      }

      // 光源
      var light = new THREE.DirectionalLight(0xf0f0f0);
      light.position.set(1, 1, 1).normalize();

      // 環境光
      var lightAmbient = new THREE.AmbientLight(0x606060);

      // Sceneに設定
      var scene = new THREE.Scene();
      scene.add( camera );
      scene.add( mesh );
      scene.add( particles );
      scene.add( light );
      scene.add( lightAmbient );

      // レンダラ
      var counter = document.getElementById("counter");
      function render(timestamp){
            var dt = timestamp - lastTimestamp;
            if(holding){
                  // 操作中
                  var dx = (currentY - lastY) * 0.1;
                  var dy = (currentX - lastX) * 1.5;
                  lastY = currentY;
                  lastX = currentX;

                  currentSpeed = currentSpeed * 0.9 + dy * 0.3 / dt; 

                  const dxMax = 0.1;
                  mesh.rotation.x = Math.min(dxMax, Math.max(-dxMax, mesh.rotation.x + dx));
                  mesh.rotation.y = mesh.rotation.y + dy;
            }else{
                  // 惰性
                  mesh.rotation.x = mesh.rotation.x * 0.9;
                  mesh.rotation.y = mesh.rotation.y + currentSpeed * dt;
                  if(mesh.rotation.y > 0){
                        mesh.rotation.y *= 0.9;
                  }
                  currentSpeed *= 0.99;
            }

            // パーティクルの回転と拡大
            var scale = Math.max(-currentSpeed * 100, 0);
            particles.rotation.y = mesh.rotation.y / 16;
            particles.scale.set(800, 50, 800);
            particleMaterial.size = scale * 100;
            particleMaterial.opacity = Math.min(1, scale * scale);

            // 回数（角度から計算）
            var pos = Math.floor(-mesh.rotation.y * 3 / (2 * Math.PI));
            if(pos > 0){
                  var count = Math.max(pos - 2, 0);
                  counter.innerText = count;
                  counter.className = "";
            }else{
                  counter.innerText = "👈";
                  counter.className = "waiting";
            }
            
            lastTimestamp = timestamp;
            renderer.render( scene, camera );
            window.requestAnimationFrame(render);
      }
      window.requestAnimationFrame(render);
}

function textureLoader(texturePaths, callback) {
      const loader = new THREE.TextureLoader();
      loader.crossOrigin = '*';

      var textureSet = {};
      var count = 0;
      const keys = Object.keys(texturePaths);
      keys.map(key => {
            loader.load(texturePaths[key], function( texture ){
                  textureSet[key] = texture;
                  count++;
                  if(count == keys.length){
                        callback(textureSet)
                  }
            });
      })
}

function maniWheel(){
      const paths = {
            erenchan: "./erenchan.png",
            map: "./erenchan_map.png",
            bumpMap: "./erenchan_bumpMap.png"
      };
      prepareCanvasContainer();
      textureLoader(paths, function( texture ) {
            prepareCanvas(texture);
      });
}

maniWheel();
