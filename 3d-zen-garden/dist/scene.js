import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {fountainCycle,limitPixelRatio,pickDestination,createTapTracker} from './garden-math.mjs';
import {detailGardenSurfaces,detailPondWater,addGroundDetails} from './scene-details.js?v=4';
import {addFocusDetails} from './focus-details.js?v=4';

const anchors = {
  toolkit:new THREE.Vector3(-4,2.2,-2),
  projects:new THREE.Vector3(3,1.8,-2),
  experience:new THREE.Vector3(0,.25,.3),
  about:new THREE.Vector3(-4,2.3,2.7),
  contact:new THREE.Vector3(4,.3,2.5),
};

export async function createGarden({canvas,container,onSelect,onError}) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.02;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate=false;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(40,1,.1,150);
  const controls=new OrbitControls(camera,canvas);
  controls.enablePan=false;
  controls.enableDamping=true;
  controls.dampingFactor=.075;
  controls.rotateSpeed=.55;
  controls.zoomSpeed=.7;
  controls.minPolarAngle=.34;
  controls.maxPolarAngle=1.15;
  controls.minAzimuthAngle=-.6;
  controls.maxAzimuthAngle=1.05;
  scene.add(new THREE.HemisphereLight(0xdce8d9,0x3e5846,1.4));
  const sunlight=new THREE.DirectionalLight(0xf1efd9,2.25);
  sunlight.position.set(-7,15,7);
  sunlight.castShadow=true;
  sunlight.shadow.mapSize.setScalar(innerWidth<700?1024:2048);
  Object.assign(sunlight.shadow.camera,{left:-13,right:13,top:11,bottom:-11,near:1,far:40});
  sunlight.shadow.bias=-.0005;
  sunlight.shadow.normalBias=.018;
  scene.add(sunlight);
  const fillLight=new THREE.DirectionalLight(0xb7d2bd,.48);
  fillLight.position.set(8,5,-6);scene.add(fillLight);
  const shadowFloor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.19}));
  shadowFloor.rotation.x=-Math.PI/2;shadowFloor.position.y=-.8;shadowFloor.receiveShadow=true;scene.add(shadowFloor);

  const loader=new GLTFLoader();
  let garden,bambooAsset;
  try {
    [garden,bambooAsset]=await Promise.all([loader.loadAsync('./assets/garden.glb'),loader.loadAsync('./bamboo-3d/bamboo.glb')]);
  } catch(error) {
    controls.dispose();renderer.dispose();throw error;
  }
  const selectable=[];
  detailGardenSurfaces(garden.scene);
  garden.scene.traverse(object=>{
    if(!object.isMesh)return;
    object.castShadow=true;object.receiveShadow=true;
    let current=object;let destination=null;
    while(current&&!destination){destination=pickDestination(current.name);current=current.parent;}
    if(destination){object.userData.destination=destination;selectable.push(object);}
  });
  scene.add(garden.scene);
  addGroundDetails(scene);
  addFocusDetails(scene);
  const pond=garden.scene.getObjectByName('PondWater');
  if(pond?.isMesh){
    pond.material.dispose();
    pond.material=new THREE.MeshPhysicalMaterial({color:0x649783,roughness:.16,metalness:.1,clearcoat:1,clearcoatRoughness:.1,transparent:true,opacity:.86,side:THREE.DoubleSide});
    detailPondWater(pond);
    pond.castShadow=false;
  }

  const bambooRoot=bambooAsset.scene;
  const bamboo=bambooRoot.getObjectByName('Bamboo');
  const pivot=new THREE.Group();pivot.position.set(42,18,-28);bambooRoot.add(pivot);
  if(bamboo){pivot.add(bamboo);bamboo.position.set(-17,0,0);bamboo.quaternion.identity();}
  bambooRoot.rotation.x=Math.PI/2;
  bambooRoot.scale.setScalar(.07);
  bambooRoot.position.set(-4-42*.07,.13,2.7-18*.07);
  bambooRoot.traverse(object=>{
    if(!object.isMesh)return;
    object.castShadow=true;object.receiveShadow=true;
    object.userData.destination='about';selectable.push(object);
  });
  scene.add(bambooRoot);
  const outlet=new THREE.Object3D();outlet.position.set(-3.4425,0,4.05);bamboo?.add(outlet);
  const feeder=new THREE.Object3D();feeder.position.set(26.984942,18,-43.425182);bambooRoot.add(feeder);
  const stoneMaterial=new THREE.MeshStandardMaterial({color:0x68796a,roughness:.95});
  const basin=new THREE.Mesh(new THREE.TorusGeometry(.92,.18,12,48),stoneMaterial);
  basin.rotation.x=Math.PI/2;basin.position.set(-4.95,.23,2.7);basin.castShadow=true;basin.receiveShadow=true;scene.add(basin);
  const basinWater=new THREE.Mesh(new THREE.CircleGeometry(.89,40),new THREE.MeshPhysicalMaterial({color:0x567f6e,roughness:.16,metalness:.2,clearcoat:1}));
  basinWater.rotation.x=-Math.PI/2;basinWater.position.copy(basin.position);basinWater.position.y=.2;scene.add(basinWater);
  const waterMaterial=new THREE.MeshPhysicalMaterial({color:0xc4e4df,roughness:.08,metalness:0,transparent:true,opacity:.57,clearcoat:1,side:THREE.DoubleSide,depthWrite:false});
  function makeStream(){
    const geometry=new THREE.BufferGeometry();
    const positions=new Float32Array(11*9*3);const indices=[];
    for(let ring=0;ring<10;ring++)for(let n=0;n<8;n++){const a=ring*9+n,b=a+9;indices.push(a,b,a+1,b,b+1,a+1);}
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(indices);
    const mesh=new THREE.Mesh(geometry,waterMaterial);mesh.frustumCulled=false;scene.add(mesh);return mesh;
  }
  const feedStream=makeStream(),pourStream=makeStream();
  const start=new THREE.Vector3(),end=new THREE.Vector3(),mouth=new THREE.Vector3();
  const rings=[];
  for(let i=0;i<3;i++){
    const mesh=new THREE.Mesh(new THREE.RingGeometry(.14,.15,40),new THREE.MeshBasicMaterial({color:0xd6e9d6,transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false}));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(-4.95,.212+i*.001,2.7);scene.add(mesh);rings.push(mesh);
  }
  function updateStream(mesh,a,b,radius,time){
    const positions=mesh.geometry.attributes.position;
    for(let ring=0;ring<=10;ring++){
      const t=ring/10;const x=THREE.MathUtils.lerp(a.x,b.x,t)+Math.sin(t*12-time*6)*.012*t;
      const y=THREE.MathUtils.lerp(a.y,b.y,t);const z=THREE.MathUtils.lerp(a.z,b.z,t);
      const width=radius*(1-.35*t)*(1+Math.sin(t*16-time*8)*.12);
      for(let n=0;n<=8;n++){const angle=n/8*Math.PI*2;positions.setXYZ(ring*9+n,x+Math.cos(angle)*width,y,z+Math.sin(angle)*width);}
    }
    positions.needsUpdate=true;mesh.geometry.computeVertexNormals();
  }
  let active=true,alive=true,failed=false,frame=0,elapsed=0,last=0,needsRender=true,transition=null;
  let narrowView=container.clientWidth<700;
  let inViewport=true;
  const point=new THREE.Vector3();const pointer=new THREE.Vector2();const raycaster=new THREE.Raycaster();
  const labels=[...container.querySelectorAll('.place')];
  function positionLabels(){
    const width=container.clientWidth,height=container.clientHeight;
    for(const label of labels){
      point.copy(anchors[label.dataset.open]).project(camera);
      const visible=point.z>-1&&point.z<1&&Math.abs(point.x)<1.1&&Math.abs(point.y)<1.1;
      label.style.visibility=visible?'visible':'hidden';
      label.style.left=`${(point.x*.5+.5)*width}px`;
      label.style.top=`${(-point.y*.5+.5)*height}px`;
    }
  }
  function reset(){
    transition=null;
    const narrow=container.clientWidth<700;
    narrowView=narrow;
    camera.position.set(narrow?15:8.4,narrow?21:9.9,narrow?26:13.1);
    controls.target.set(0,-.3,0);
    controls.minDistance=narrow?23:14;controls.maxDistance=narrow?45:36;
    controls.update();needsRender=true;schedule();
  }
  function resize(){
    const width=container.clientWidth,height=container.clientHeight;
    if(!width||!height)return;
    if((width<700)!==narrowView)reset();
    camera.aspect=width/height;camera.updateProjectionMatrix();
    renderer.setPixelRatio(limitPixelRatio(devicePixelRatio||1,width));renderer.setSize(width,height,false);
    needsRender=true;schedule();
  }
  function schedule(){if(alive&&!failed&&!frame&&!document.hidden&&inViewport)frame=requestAnimationFrame(draw);}
  function draw(time){
    frame=0;if(!alive||failed||document.hidden||!inViewport){last=0;return;}
    const dt=last?Math.min((time-last)/1000,.05):0;last=time;
    if(active)elapsed+=dt;
    if(transition){
      const amount=Math.min(1,(time-transition.start)/650);const eased=amount*amount*(3-2*amount);
      camera.position.lerpVectors(transition.from,transition.to,eased);controls.target.lerpVectors(transition.targetFrom,transition.targetTo,eased);
      if(amount===1)transition=null;
      needsRender=true;
    }
    if(active||needsRender){
      const cycle=fountainCycle(elapsed);pivot.rotation.y=cycle.angle;bambooRoot.updateMatrixWorld(true);
      outlet.getWorldPosition(mouth);feeder.getWorldPosition(start);
      end.set(start.x,Math.max(.35,mouth.y+.04),start.z);
      updateStream(feedStream,start,end,.018,elapsed);
      pourStream.visible=cycle.phase==='pour'||cycle.phase==='tip'&&cycle.angle>.3;
      if(pourStream.visible){end.set(mouth.x-.12,.23,mouth.z);updateStream(pourStream,mouth,end,.028,elapsed);}
      rings.forEach((ring,i)=>{const phase=(elapsed*.55+i/3)%1;ring.scale.setScalar(.7+phase*4.5);ring.material.opacity=(1-phase)*.3;});
      if(pond?.isMesh)pond.material.roughness=.18+Math.sin(elapsed*.8)*.03;
    }
    controls.update();
    if(active||needsRender){
      renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);positionLabels();needsRender=false;
      canvas.dataset.ready='true';
    }
    if(active||transition)schedule();
  }
  controls.addEventListener('change',()=>{needsRender=true;schedule();});
  const tap=createTapTracker();
  function hit(event){const bounds=canvas.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(selectable,false)[0]?.object.userData.destination;}
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;tap.down(event.pointerId,event.clientX,event.clientY);transition=null;});
  canvas.addEventListener('pointerup',event=>{if(tap.up(event.pointerId,event.clientX,event.clientY)){const destination=hit(event);if(destination)onSelect(destination);}});
  canvas.addEventListener('pointercancel',event=>tap.cancel(event.pointerId));
  canvas.addEventListener('pointermove',event=>{tap.move(event.pointerId,event.clientX,event.clientY);if(tap.dragging)return;const destination=hit(event);canvas.style.cursor=destination?'pointer':'grab';labels.forEach(label=>label.classList.toggle('is-hovered',label.dataset.open===destination));});
  canvas.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','+','=','-'].includes(event.key))return;
    event.preventDefault();transition=null;
    if(event.key==='Home'){reset();return;}
    const offset=camera.position.clone().sub(controls.target);const spherical=new THREE.Spherical().setFromVector3(offset);
    if(event.key==='ArrowLeft'||event.key==='ArrowRight')spherical.theta=THREE.MathUtils.clamp(spherical.theta+(event.key==='ArrowLeft'?-.12:.12),controls.minAzimuthAngle,controls.maxAzimuthAngle);
    else if(event.key==='ArrowUp'||event.key==='ArrowDown')spherical.phi=THREE.MathUtils.clamp(spherical.phi+(event.key==='ArrowUp'?-.08:.08),controls.minPolarAngle,controls.maxPolarAngle);
    else spherical.radius=THREE.MathUtils.clamp(spherical.radius*(event.key==='-'?1.1:.9),controls.minDistance,controls.maxDistance);
    camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));controls.update();needsRender=true;schedule();
  });
  const observer=new ResizeObserver(resize);observer.observe(container);
  const visibilityObserver=new IntersectionObserver(entries=>{inViewport=entries[0].isIntersecting;if(!inViewport){cancelAnimationFrame(frame);frame=0;last=0;}else{needsRender=true;schedule();}});visibilityObserver.observe(canvas);
  const onVisibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else{needsRender=true;schedule();}};
  document.addEventListener('visibilitychange',onVisibility);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;active=false;cancelAnimationFrame(frame);frame=0;onError(new Error('The 3D view lost its graphics connection. Reload or use Quick view.'));});
  reset();resize();
  return {
    setActive(value){if(!alive||failed)return;active=value;last=0;needsRender=true;schedule();},
    reset,
    focus(place,animate=true){const anchor=anchors[place];if(!anchor||!alive||failed)return;const target=anchor.clone().multiplyScalar(.5);const to=target.clone().add(new THREE.Vector3(8.5,10.5,14.5));if(animate){transition={start:performance.now(),from:camera.position.clone(),to,targetFrom:controls.target.clone(),targetTo:target};}else{transition=null;camera.position.copy(to);controls.target.copy(target);needsRender=true;}schedule();},
    dispose(){alive=false;cancelAnimationFrame(frame);observer.disconnect();visibilityObserver.disconnect();document.removeEventListener('visibilitychange',onVisibility);controls.dispose();const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:object.material?[object.material]:[]){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();},
  };
}
