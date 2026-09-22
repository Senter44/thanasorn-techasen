var Yn=Object.defineProperty;var Hn=(u,x,b)=>x in u?Yn(u,x,{enumerable:!0,configurable:!0,writable:!0,value:b}):u[x]=b;var V=(u,x,b)=>Hn(u,typeof x!="symbol"?x+"":x,b);(function(){const x=document.createElement("link").relList;if(x&&x.supports&&x.supports("modulepreload"))return;for(const z of document.querySelectorAll('link[rel="modulepreload"]'))P(z);new MutationObserver(z=>{for(const S of z)if(S.type==="childList")for(const L of S.addedNodes)L.tagName==="LINK"&&L.rel==="modulepreload"&&P(L)}).observe(document,{childList:!0,subtree:!0});function b(z){const S={};return z.integrity&&(S.integrity=z.integrity),z.referrerPolicy&&(S.referrerPolicy=z.referrerPolicy),z.crossOrigin==="use-credentials"?S.credentials="include":z.crossOrigin==="anonymous"?S.credentials="omit":S.credentials="same-origin",S}function P(z){if(z.ep)return;z.ep=!0;const S=b(z);fetch(z.href,S)}})();(()=>{const u=[72,60,36],x=[42,28,18],b=17,P=26,z=4.7,S=4.05,L=.85,X=_=>.24-Math.max(0,Math.min(100,_))*.0046;function O(_,E){const N=_[0]-b,U=Math.cos(E),J=Math.sin(E);return[x[0]+U*N-J*_[1],x[1]+J*N+U*_[1],x[2]+_[2]]}function G(_,E){const N=_[0]-x[0],U=_[1]-x[1],J=Math.cos(E),C=Math.sin(E);return[J*N+C*U+b,-C*N+J*U,_[2]-x[2]]}function T(_){const E=Math.hypot(_[1],_[2]),N=Math.max(E-z,S-E,(L*_[1]-_[0])/Math.hypot(1,L),_[0]-P),U=Math.max(E-z,Math.abs(_[0]-P)-.4),J=Math.max(E-z,Math.abs(_[0]-18)-.4);return Math.min(N,U,J)}function I(_){const E=[..._];for(let N=0;N<5;N++){const U=T(E);if(U>=.15)break;const J=E.map((Y,$)=>{const K=[...E],nt=[...E];return K[$]+=.001,nt[$]-=.001,T(K)-T(nt)}),C=Math.hypot(...J)||1;for(let Y=0;Y<3;Y++)E[Y]+=J[Y]/C*(.151-U)}return E}function Z(_,E,N=!0){const U=[];for(let C=1;N&&C<17.4;C+=.68)for(let Y=-3.65;Y<-1.35;Y+=.68)for(let $=-3.6;$<3.7;$+=.68){const K=[C,Y,$];T(K)>.3&&Math.hypot(Y,$)<3.7&&U.push(O(K,E))}for(let C=3.6;U.length<_&&C<12;C+=.68)for(let Y=-12.8;Y<13;Y+=.68)for(let $=-12.8;$<13&&U.length<_;$+=.68)Math.hypot(Y,$)<12.8&&U.push([24+Y,C,18+$]);if(U.length<_)throw new Error("Particle count exceeds the basin capacity");return U.slice(0,_)}class Q{constructor(){V(this,"credit",0)}take(E,N){this.credit+=Math.max(0,Math.min(1,E))*3*Math.max(0,Math.min(6,N));const U=Math.floor(this.credit+1e-9);return this.credit=Math.max(0,this.credit-U),U}}const st=(_,E,N)=>(_+E)%N;globalThis.BambooGeometry={grid:u,pivot:x,axle:b,length:P,outer:z,inner:S,cut:L,angleForHeight:X,toWorld:O,toLocal:G,solidDistance:T,projectOut:I,initialParticles:Z,EmissionBudget:Q,advanceEmissionCursor:st}})();(()=>{class u{constructor(){V(this,"rest",-.3);V(this,"limit",.78);this.reset()}reset(){this.angle=this.rest,this.velocity=0,this.cycles=0,this.tipped=!1,this.phase="Filling"}step(b,P,z){let S=Math.max(0,Math.min(.05,b));for(;S>1e-9;){const L=Math.min(S,.008333333333333333),X=1e3*Math.cos(this.angle),O=900+Math.max(0,P)*1.2,G=(z-X)/O-this.velocity*.5;this.velocity=Math.max(-.9,Math.min(.9,this.velocity+G*L)),this.angle+=this.velocity*L,this.angle>.2&&(this.tipped=!0),this.angle>=this.limit&&(this.angle=this.limit,this.velocity=Math.min(0,this.velocity)),this.angle<=this.rest&&(this.angle=this.rest,this.velocity=0,this.tipped&&(this.cycles++,this.tipped=!1)),this.phase=this.angle<=this.rest+.02?"Filling":this.velocity<-.025?"Returning":"Tipping",S-=L}return this.angle}}globalThis.ShishiMechanism=u})();var On=`struct Cell {\r
    vx: i32, \r
    vy: i32, \r
    vz: i32, \r
    mass: i32, \r
}

@group(0) @binding(0) var<storage, read_write> cells: array<Cell>;

@compute @workgroup_size(64)\r
fn clearGrid(@builtin(global_invocation_id) id: vec3<u32>) {\r
    if (id.x < arrayLength(&cells)) {\r
        cells[id.x].mass = 0;\r
        cells[id.x].vx = 0;\r
        cells[id.x].vy = 0;\r
        cells[id.x].vz = 0;\r
    }\r
}`,Rn=`struct Particle {\r
    position: vec3f, \r
    v: vec3f, \r
    C: mat3x3f, \r
}\r
struct Cell {\r
    vx: atomic<i32>, \r
    vy: atomic<i32>, \r
    vz: atomic<i32>, \r
    mass: atomic<i32>, \r
}

override fixedPointMultiplier: f32; 

fn encodeFixedPoint(floatingPoint: f32) -> i32 {\r
	return i32(floatingPoint * fixedPointMultiplier);\r
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;\r
@group(0) @binding(1) var<storage, read_write> cells: array<Cell>;\r
@group(0) @binding(2) var<uniform> initBoxSize: vec3f;\r
@group(0) @binding(3) var<uniform> numParticles: u32;

@compute @workgroup_size(64)\r
fn p2g_1(@builtin(global_invocation_id) id: vec3<u32>) {\r
    if (id.x < numParticles) {\r
        var weights: array<vec3f, 3>;

        let particle = particles[id.x];\r
        let cellIndex: vec3f = floor(particle.position);\r
        let cellDiff: vec3f = particle.position - (cellIndex + 0.5f);\r
        weights[0] = 0.5f * (0.5f - cellDiff) * (0.5f - cellDiff);\r
        weights[1] = 0.75f - cellDiff * cellDiff;\r
        weights[2] = 0.5f * (0.5f + cellDiff) * (0.5f + cellDiff);

        let C: mat3x3f = particle.C;

        for (var gx = 0; gx < 3; gx++) {\r
            for (var gy = 0; gy < 3; gy++) {\r
                for (var gz = 0; gz < 3; gz++) {\r
                    let weight: f32 = weights[gx].x * weights[gy].y * weights[gz].z;\r
                    let cellX: vec3f = vec3f(\r
                            cellIndex.x + f32(gx) - 1., \r
                            cellIndex.y + f32(gy) - 1.,\r
                            cellIndex.z + f32(gz) - 1.  \r
                        );\r
                    let cellDist = (cellX + 0.5f) - particle.position;

                    let Q: vec3f = C * cellDist;

                    let massContrib: f32 = weight * 1.0; 
                    let velContrib: vec3f = massContrib * (particle.v + Q);\r
                    let cellIndex1D: i32 = \r
                        i32(cellX.x) * i32(initBoxSize.y) * i32(initBoxSize.z) + \r
                        i32(cellX.y) * i32(initBoxSize.z) + \r
                        i32(cellX.z);\r
                    atomicAdd(&cells[cellIndex1D].mass, encodeFixedPoint(massContrib));\r
                    atomicAdd(&cells[cellIndex1D].vx, encodeFixedPoint(velContrib.x));\r
                    atomicAdd(&cells[cellIndex1D].vy, encodeFixedPoint(velContrib.y));\r
                    atomicAdd(&cells[cellIndex1D].vz, encodeFixedPoint(velContrib.z));\r
                }\r
            }\r
        }\r
    }\r
}`,Wn=`struct Particle {\r
    position: vec3f, \r
    v: vec3f, \r
    C: mat3x3f, \r
}\r
struct Cell {\r
    vx: atomic<i32>, \r
    vy: atomic<i32>, \r
    vz: atomic<i32>, \r
    mass: i32, \r
}

override fixedPointMultiplier: f32; \r
override fixedPointMultiplierInverse: f32; \r
override stiffness: f32;\r
override restDensity: f32;\r
override dynamicViscosity: f32;

fn encodeFixedPoint(floatingPoint: f32) -> i32 {\r
	return i32(floatingPoint * fixedPointMultiplier);\r
}\r
fn decodeFixedPoint(fixedPoint: i32) -> f32 {\r
	return f32(fixedPoint) * fixedPointMultiplierInverse;\r
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;\r
@group(0) @binding(1) var<storage, read_write> cells: array<Cell>;\r
@group(0) @binding(2) var<uniform> initBoxSize: vec3f;\r
@group(0) @binding(3) var<uniform> numParticles: u32;\r
@group(0) @binding(4) var<storage, read_write> densities: array<f32>;\r
@group(0) @binding(5) var<uniform> dt: f32;

@compute @workgroup_size(64)\r
fn p2g_2(@builtin(global_invocation_id) id: vec3<u32>) {\r
    if (id.x < numParticles) {\r
        var weights: array<vec3f, 3>;

        let particle = particles[id.x];\r
        let cellIndex: vec3f = floor(particle.position);\r
        let cellDiff: vec3f = particle.position - (cellIndex + 0.5f);\r
        weights[0] = 0.5f * (0.5f - cellDiff) * (0.5f - cellDiff);\r
        weights[1] = 0.75f - cellDiff * cellDiff;\r
        weights[2] = 0.5f * (0.5f + cellDiff) * (0.5f + cellDiff);

        var density: f32 = 0.;\r
        for (var gx = 0; gx < 3; gx++) {\r
            for (var gy = 0; gy < 3; gy++) {    \r
                for (var gz = 0; gz < 3; gz++) {\r
                    let weight: f32 = weights[gx].x * weights[gy].y * weights[gz].z;\r
                    let cellX: vec3f = vec3f(\r
                            cellIndex.x + f32(gx) - 1., \r
                            cellIndex.y + f32(gy) - 1.,\r
                            cellIndex.z + f32(gz) - 1.  \r
                        );\r
                    let cellIndex1D: i32 = \r
                        i32(cellX.x) * i32(initBoxSize.y) * i32(initBoxSize.z) + \r
                        i32(cellX.y) * i32(initBoxSize.z) + \r
                        i32(cellX.z);\r
                    density += decodeFixedPoint(cells[cellIndex1D].mass) * weight;\r
                }\r
            }\r
        }

        let volume: f32 = 1.0 / density; 
        densities[id.x] = density;

        let pressure: f32 = max(-0.0, stiffness * (pow(density / restDensity, 1.) - 1));

        var stress: mat3x3f = mat3x3f(-pressure, 0, 0, 0, -pressure, 0, 0, 0, -pressure);\r
        let dudv: mat3x3f = particle.C;\r
        let strain: mat3x3f = dudv + transpose(dudv);\r
        stress += dynamicViscosity * strain;

        let eq_16_term0 = -volume * 4 * stress * dt;

        for (var gx = 0; gx < 3; gx++) {\r
            for (var gy = 0; gy < 3; gy++) {\r
                for (var gz = 0; gz < 3; gz++) {\r
                    let weight: f32 = weights[gx].x * weights[gy].y * weights[gz].z;\r
                    let cellX: vec3f = vec3f(\r
                            cellIndex.x + f32(gx) - 1., \r
                            cellIndex.y + f32(gy) - 1.,\r
                            cellIndex.z + f32(gz) - 1.  \r
                        );\r
                    let cellDist = (cellX + 0.5f) - particle.position;\r
                    let cellIndex1D: i32 = \r
                        i32(cellX.x) * i32(initBoxSize.y) * i32(initBoxSize.z) + \r
                        i32(cellX.y) * i32(initBoxSize.z) + \r
                        i32(cellX.z);\r
                    let momentum: vec3f = eq_16_term0 * weight * cellDist;\r
                    atomicAdd(&cells[cellIndex1D].vx, encodeFixedPoint(momentum.x));\r
                    atomicAdd(&cells[cellIndex1D].vy, encodeFixedPoint(momentum.y));\r
                    atomicAdd(&cells[cellIndex1D].vz, encodeFixedPoint(momentum.z));\r
                }\r
            }\r
        }\r
    }\r
}`,jn=`struct Particle {\r
    position: vec3f, \r
    v: vec3f, \r
    C: mat3x3f, \r
}

struct PosVel {\r
    position: vec3f, \r
    v: vec3f, \r
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;\r
@group(0) @binding(1) var<storage, read_write> posvel: array<PosVel>;\r
@group(0) @binding(2) var<uniform> numParticles: u32;

@compute @workgroup_size(64)\r
fn copyPosition(@builtin(global_invocation_id) id: vec3<u32>) {\r
    if (id.x < numParticles) { \r
        posvel[id.x].position = particles[id.x].position;\r
        posvel[id.x].v = particles[id.x].v;\r
    }\r
}`,cn=`struct Bamboo { rotation: vec4f, emission: vec4f, previous: vec4f }

fn localPoint(p: vec3f, b: Bamboo) -> vec3f {
  let d = p - vec3f(42,28,18);
  return vec3f(b.rotation.x*d.x + b.rotation.y*d.y + 17, -b.rotation.y*d.x + b.rotation.x*d.y, d.z);
}
fn worldPoint(p: vec3f, b: Bamboo) -> vec3f {
  let d = p - vec3f(17,0,0);
  return vec3f(b.rotation.x*d.x - b.rotation.y*d.y, b.rotation.y*d.x + b.rotation.x*d.y, d.z) + vec3f(42,28,18);
}
fn worldVector(n: vec3f, b: Bamboo) -> vec3f { return vec3f(b.rotation.x*n.x-b.rotation.y*n.y,b.rotation.y*n.x+b.rotation.x*n.y,n.z); }
fn bambooDistance(p: vec3f) -> f32 {
  let r = length(p.yz);
  let shell = max(max(r-4.7,4.05-r),max((.85*p.y-p.x)/1.3124405,p.x-26));
  let cap = max(r-4.7,abs(p.x-26)-.4);
  let node = max(r-4.7,abs(p.x-18)-.4);
  return min(min(shell,cap),node);
}
fn bambooNormal(p: vec3f) -> vec3f {
  let e = .015;
  return normalize(vec3f(bambooDistance(p+vec3f(e,0,0))-bambooDistance(p-vec3f(e,0,0)),bambooDistance(p+vec3f(0,e,0))-bambooDistance(p-vec3f(0,e,0)),bambooDistance(p+vec3f(0,0,e))-bambooDistance(p-vec3f(0,0,e)))+vec3f(.000001));
}`,Nn=`struct Cell { vx:i32, vy:i32, vz:i32, mass:i32 }
@group(0) @binding(0) var<storage,read_write> cells:array<Cell>;
@group(0) @binding(1) var<uniform> b:Bamboo;
@group(0) @binding(2) var<uniform> size:vec3f;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id:vec3u) {
  if(id.x >= arrayLength(&cells) || cells[id.x].mass <= 0) { return; }
  let mass = f32(cells[id.x].mass);
  var v = vec3f(f32(cells[id.x].vx),f32(cells[id.x].vy),f32(cells[id.x].vz))/mass;
  v.y -= .4*b.rotation.w;
  let i = i32(id.x);
  let p = vec3f(f32(i/i32(size.y)/i32(size.z)),f32((i/i32(size.z))%i32(size.y)),f32(i%i32(size.z)))+.5;
  let local = localPoint(p,b);
  if(bambooDistance(local)<.65) {
    let n = worldVector(bambooNormal(local),b);
    let wall = worldVector(vec3f(-local.y,local.x-17,0),b)*b.previous.z;
    v -= n*min(0.,dot(v-wall,n));
  }
  if(p.y < 3.5) { v.y=max(v.y,0.); v.x*=.99; v.z*=.99; }
  if(p.y<14.) {
    let radial=p.xz-vec2f(24,18); let r=length(radial);
    if(r>13. && r<18.) { let n=radial/max(r,.01); let outward=max(0.,dot(v.xz,n)); v.x-=outward*n.x;v.z-=outward*n.y; }
  }
  
  if(p.y>40. && length(p.xz-vec2f(28.1,18))<2.5){v=vec3f(-.04,-1.3,0);}
  v=clamp(v,vec3f(-5),vec3f(5));
  cells[id.x].vx=i32(v.x*1e6); cells[id.x].vy=i32(v.y*1e6); cells[id.x].vz=i32(v.z*1e6);
}`,$n=`struct Particle { position:vec3f, v:vec3f, C:mat3x3f }
struct Cell { vx:i32, vy:i32, vz:i32, mass:i32 }
@group(0) @binding(0) var<storage,read_write> particles:array<Particle>;
@group(0) @binding(1) var<storage,read> cells:array<Cell>;
@group(0) @binding(2) var<uniform> b:Bamboo;
@group(0) @binding(3) var<uniform> size:vec3f;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id:vec3u) {
  if(id.x>=arrayLength(&particles)) { return; }
  var p=particles[id.x]; let base=floor(p.position); let d=p.position-(base+.5);
  var w:array<vec3f,3>; w[0]=.5*(.5-d)*(.5-d); w[1]=.75-d*d; w[2]=.5*(.5+d)*(.5+d);
  var v=vec3f(0); var C=mat3x3f(vec3f(0),vec3f(0),vec3f(0));
  for(var x=0;x<3;x++){for(var y=0;y<3;y++){for(var z=0;z<3;z++){
    let cell=base+vec3f(f32(x),f32(y),f32(z))-1.;
    let index=i32(cell.x)*i32(size.y)*i32(size.z)+i32(cell.y)*i32(size.z)+i32(cell.z);
    let c=cells[index]; let vel=vec3f(f32(c.vx),f32(c.vy),f32(c.vz))*1e-6*w[x].x*w[y].y*w[z].z;
    let dist=cell+.5-p.position;
    v+=vel; C+=mat3x3f(vel*dist.x,vel*dist.y,vel*dist.z);
  }}}
  p.v=clamp(v,vec3f(-5),vec3f(5)); p.C=C*4.; p.position+=p.v*b.rotation.w;
  for(var iteration=0;iteration<3;iteration++) {
    let local=localPoint(p.position,b); let distance=bambooDistance(local);
    if(distance>=.2){break;}
    let n=worldVector(bambooNormal(local),b); p.position+=n*(.205-distance);
    let wall=worldVector(vec3f(-local.y,local.x-17,0),b)*b.previous.z;
    p.v-=n*min(0.,dot(p.v-wall,n));
  }
  if(p.position.y<14.) {
    let radial=p.position.xz-vec2f(24,18); let r=length(radial);
    if(r>13.3){let n=radial/max(r,.01);p.position.x=24+n.x*13.3;p.position.z=18+n.y*13.3;let out=max(0.,dot(p.v.xz,n));p.v.x-=n.x*out;p.v.z-=n.y*out;}
  }
  if(p.position.y<3.4){p.position.y=3.4;p.v.y=max(p.v.y,0.);}
  p.position=clamp(p.position,vec3f(2),size-vec3f(3));
  particles[id.x]=p;
}`,Zn=`struct Particle { position:vec3f, v:vec3f, C:mat3x3f }
@group(0) @binding(0) var<storage,read_write> particles:array<Particle>;
@group(0) @binding(1) var<uniform> b:Bamboo;
fn random(x:f32)->f32{return fract(sin(x*127.1+311.7)*43758.5453);}
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id:vec3u) {
  
  if(f32(id.x)>=b.emission.y){return;}
  let index=(u32(b.emission.x)+id.x)%arrayLength(&particles);
  var p=particles[index];
  if(p.position.y>12.){return;}
  let seed=f32(index)+b.rotation.z*173.;
  
  p.position=vec3f(28.1+(random(seed)-.5)*.9,43.05+random(seed+2.)*1.2,18.+(random(seed+1.)-.5)*.9);
  p.v=vec3f(-.04,-1.3,0);
  p.C=mat3x3f(vec3f(0),vec3f(0),vec3f(0)); particles[index]=p;
}`;class Qn{constructor(x){V(this,"count",8e3);V(this,"buffers",[]);V(this,"particles");V(this,"positions");V(this,"bamboo");V(this,"stages",[]);V(this,"emit");V(this,"time",0);V(this,"cursor",0);V(this,"emission",new BambooGeometry.EmissionBudget);V(this,"lastAngle",-.3);V(this,"values",new Float32Array(12));this.device=x;const b=(T,I=!1)=>{const Z=x.createBuffer({size:T,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC|(I?GPUBufferUsage.UNIFORM:GPUBufferUsage.STORAGE)});return this.buffers.push(Z),Z};this.particles=b(this.count*80),this.positions=b(this.count*32),this.bamboo=b(48,!0);const P=b(16,!0),z=b(4,!0),S=b(4,!0),L=BambooGeometry.grid.reduce((T,I)=>T*I,1),X=b(L*16),O=b(this.count*4);x.queue.writeBuffer(P,0,new Float32Array([...BambooGeometry.grid,0])),x.queue.writeBuffer(z,0,new Uint32Array([this.count])),x.queue.writeBuffer(S,0,new Float32Array([.12]));const G=(T,I,Z,Q={},st=this.count)=>{const _=x.createComputePipeline({label:T,layout:"auto",compute:{module:x.createShaderModule({label:T,code:I}),constants:Q}}),E=x.createBindGroup({layout:_.getBindGroupLayout(0),entries:Z.map((N,U)=>({binding:U,resource:{buffer:N}}))});return{pipeline:_,group:E,work:Math.ceil(st/64)}};this.emit=G("Recycle pool water into bamboo",cn+Zn,[this.particles,this.bamboo]),this.stages=[G("Splash clear grid",On,[X],{},L),G("Splash mass transfer",Rn,[this.particles,X,P,z],{fixedPointMultiplier:1e6}),G("Splash pressure transfer",Wn,[this.particles,X,P,z,O,S],{fixedPointMultiplier:1e6,fixedPointMultiplierInverse:1e-6,stiffness:32,restDensity:3,dynamicViscosity:.06}),G("Gravity and moving hollow collider",cn+Nn,[X,this.bamboo,P],{},L),G("Splash grid to particles and collisions",cn+$n,[this.particles,X,this.bamboo,P]),G("Copy fluid positions",jn,[this.particles,this.positions,z])],this.reset()}reset(){this.lastAngle=-.3,this.time=0,this.cursor=0,this.emission=new BambooGeometry.EmissionBudget;const x=BambooGeometry.initialParticles(this.count,this.lastAngle,!1),b=new Float32Array(this.count*20),P=new Float32Array(this.count*8);x.forEach((z,S)=>{b.set(z,S*20),P.set(z,S*8)}),this.device.queue.writeBuffer(this.particles,0,b),this.device.queue.writeBuffer(this.positions,0,P)}update(x,b,P){const z=Math.max(0,Math.min(1,P)),S=this.emission.take(z,b);this.values.set([Math.cos(x),Math.sin(x),this.time,.12,this.cursor,S,z,0,Math.cos(this.lastAngle),Math.sin(this.lastAngle),b?(x-this.lastAngle)/(.12*b):0,0]),this.device.queue.writeBuffer(this.bamboo,0,this.values),this.lastAngle=x,b&&(this.cursor=BambooGeometry.advanceEmissionCursor(this.cursor,S,this.count),this.time+=b*.12)}execute(x,b){if(!b)return;const P=x.beginComputePass();P.setPipeline(this.emit.pipeline),P.setBindGroup(0,this.emit.group),P.dispatchWorkgroups(1);for(let z=0;z<b;z++)for(const S of this.stages)P.setPipeline(S.pipeline),P.setBindGroup(0,S.group),P.dispatchWorkgroups(S.work);P.end()}destroy(){this.buffers.forEach(x=>x.destroy())}}function Jn(u,x){return class extends u{constructor(...b){super(...b),x(this)}}}const Kn=Jn(Array,u=>u.fill(0));let k=1e-6;function Cn(u){function x(t=0,i=0){const n=new u(2);return t!==void 0&&(n[0]=t,i!==void 0&&(n[1]=i)),n}const b=x;function P(t,i,n){const s=n??new u(2);return s[0]=t,s[1]=i,s}function z(t,i){const n=i??new u(2);return n[0]=Math.ceil(t[0]),n[1]=Math.ceil(t[1]),n}function S(t,i){const n=i??new u(2);return n[0]=Math.floor(t[0]),n[1]=Math.floor(t[1]),n}function L(t,i){const n=i??new u(2);return n[0]=Math.round(t[0]),n[1]=Math.round(t[1]),n}function X(t,i=0,n=1,s){const a=s??new u(2);return a[0]=Math.min(n,Math.max(i,t[0])),a[1]=Math.min(n,Math.max(i,t[1])),a}function O(t,i,n){const s=n??new u(2);return s[0]=t[0]+i[0],s[1]=t[1]+i[1],s}function G(t,i,n,s){const a=s??new u(2);return a[0]=t[0]+i[0]*n,a[1]=t[1]+i[1]*n,a}function T(t,i){const n=t[0],s=t[1],a=i[0],v=i[1],y=Math.sqrt(n*n+s*s),c=Math.sqrt(a*a+v*v),l=y*c,p=l&&ct(t,i)/l;return Math.acos(p)}function I(t,i,n){const s=n??new u(2);return s[0]=t[0]-i[0],s[1]=t[1]-i[1],s}const Z=I;function Q(t,i){return Math.abs(t[0]-i[0])<k&&Math.abs(t[1]-i[1])<k}function st(t,i){return t[0]===i[0]&&t[1]===i[1]}function _(t,i,n,s){const a=s??new u(2);return a[0]=t[0]+n*(i[0]-t[0]),a[1]=t[1]+n*(i[1]-t[1]),a}function E(t,i,n,s){const a=s??new u(2);return a[0]=t[0]+n[0]*(i[0]-t[0]),a[1]=t[1]+n[1]*(i[1]-t[1]),a}function N(t,i,n){const s=n??new u(2);return s[0]=Math.max(t[0],i[0]),s[1]=Math.max(t[1],i[1]),s}function U(t,i,n){const s=n??new u(2);return s[0]=Math.min(t[0],i[0]),s[1]=Math.min(t[1],i[1]),s}function J(t,i,n){const s=n??new u(2);return s[0]=t[0]*i,s[1]=t[1]*i,s}const C=J;function Y(t,i,n){const s=n??new u(2);return s[0]=t[0]/i,s[1]=t[1]/i,s}function $(t,i){const n=i??new u(2);return n[0]=1/t[0],n[1]=1/t[1],n}const K=$;function nt(t,i,n){const s=n??new u(3),a=t[0]*i[1]-t[1]*i[0];return s[0]=0,s[1]=0,s[2]=a,s}function ct(t,i){return t[0]*i[0]+t[1]*i[1]}function ft(t){const i=t[0],n=t[1];return Math.sqrt(i*i+n*n)}const Ft=ft;function W(t){const i=t[0],n=t[1];return i*i+n*n}const tt=W;function R(t,i){const n=t[0]-i[0],s=t[1]-i[1];return Math.sqrt(n*n+s*s)}const Gt=R;function mt(t,i){const n=t[0]-i[0],s=t[1]-i[1];return n*n+s*s}const It=mt;function yt(t,i){const n=i??new u(2),s=t[0],a=t[1],v=Math.sqrt(s*s+a*a);return v>1e-5?(n[0]=s/v,n[1]=a/v):(n[0]=0,n[1]=0),n}function Vt(t,i){const n=i??new u(2);return n[0]=-t[0],n[1]=-t[1],n}function et(t,i){const n=i??new u(2);return n[0]=t[0],n[1]=t[1],n}const Et=et;function Tt(t,i,n){const s=n??new u(2);return s[0]=t[0]*i[0],s[1]=t[1]*i[1],s}const Xt=Tt;function St(t,i,n){const s=n??new u(2);return s[0]=t[0]/i[0],s[1]=t[1]/i[1],s}const Lt=St;function At(t=1,i){const n=i??new u(2),s=Math.random()*2*Math.PI;return n[0]=Math.cos(s)*t,n[1]=Math.sin(s)*t,n}function r(t){const i=t??new u(2);return i[0]=0,i[1]=0,i}function d(t,i,n){const s=n??new u(2),a=t[0],v=t[1];return s[0]=a*i[0]+v*i[4]+i[12],s[1]=a*i[1]+v*i[5]+i[13],s}function e(t,i,n){const s=n??new u(2),a=t[0],v=t[1];return s[0]=i[0]*a+i[4]*v+i[8],s[1]=i[1]*a+i[5]*v+i[9],s}function o(t,i,n,s){const a=s??new u(2),v=t[0]-i[0],y=t[1]-i[1],c=Math.sin(n),l=Math.cos(n);return a[0]=v*l-y*c+i[0],a[1]=v*c+y*l+i[1],a}function f(t,i,n){const s=n??new u(2);return yt(t,s),J(s,i,s)}function h(t,i,n){const s=n??new u(2);return ft(t)>i?f(t,i,s):et(t,s)}function m(t,i,n){const s=n??new u(2);return _(t,i,.5,s)}return{create:x,fromValues:b,set:P,ceil:z,floor:S,round:L,clamp:X,add:O,addScaled:G,angle:T,subtract:I,sub:Z,equalsApproximately:Q,equals:st,lerp:_,lerpV:E,max:N,min:U,mulScalar:J,scale:C,divScalar:Y,inverse:$,invert:K,cross:nt,dot:ct,length:ft,len:Ft,lengthSq:W,lenSq:tt,distance:R,dist:Gt,distanceSq:mt,distSq:It,normalize:yt,negate:Vt,copy:et,clone:Et,multiply:Tt,mul:Xt,divide:St,div:Lt,random:At,zero:r,transformMat4:d,transformMat3:e,rotate:o,setLength:f,truncate:h,midpoint:m}}const An=new Map;function Gn(u){let x=An.get(u);return x||(x=Cn(u),An.set(u,x)),x}function te(u){function x(c,l,p){const w=new u(3);return c!==void 0&&(w[0]=c,l!==void 0&&(w[1]=l,p!==void 0&&(w[2]=p))),w}const b=x;function P(c,l,p,w){const g=w??new u(3);return g[0]=c,g[1]=l,g[2]=p,g}function z(c,l){const p=l??new u(3);return p[0]=Math.ceil(c[0]),p[1]=Math.ceil(c[1]),p[2]=Math.ceil(c[2]),p}function S(c,l){const p=l??new u(3);return p[0]=Math.floor(c[0]),p[1]=Math.floor(c[1]),p[2]=Math.floor(c[2]),p}function L(c,l){const p=l??new u(3);return p[0]=Math.round(c[0]),p[1]=Math.round(c[1]),p[2]=Math.round(c[2]),p}function X(c,l=0,p=1,w){const g=w??new u(3);return g[0]=Math.min(p,Math.max(l,c[0])),g[1]=Math.min(p,Math.max(l,c[1])),g[2]=Math.min(p,Math.max(l,c[2])),g}function O(c,l,p){const w=p??new u(3);return w[0]=c[0]+l[0],w[1]=c[1]+l[1],w[2]=c[2]+l[2],w}function G(c,l,p,w){const g=w??new u(3);return g[0]=c[0]+l[0]*p,g[1]=c[1]+l[1]*p,g[2]=c[2]+l[2]*p,g}function T(c,l){const p=c[0],w=c[1],g=c[2],M=l[0],D=l[1],q=l[2],F=Math.sqrt(p*p+w*w+g*g),A=Math.sqrt(M*M+D*D+q*q),B=F*A,H=B&&ct(c,l)/B;return Math.acos(H)}function I(c,l,p){const w=p??new u(3);return w[0]=c[0]-l[0],w[1]=c[1]-l[1],w[2]=c[2]-l[2],w}const Z=I;function Q(c,l){return Math.abs(c[0]-l[0])<k&&Math.abs(c[1]-l[1])<k&&Math.abs(c[2]-l[2])<k}function st(c,l){return c[0]===l[0]&&c[1]===l[1]&&c[2]===l[2]}function _(c,l,p,w){const g=w??new u(3);return g[0]=c[0]+p*(l[0]-c[0]),g[1]=c[1]+p*(l[1]-c[1]),g[2]=c[2]+p*(l[2]-c[2]),g}function E(c,l,p,w){const g=w??new u(3);return g[0]=c[0]+p[0]*(l[0]-c[0]),g[1]=c[1]+p[1]*(l[1]-c[1]),g[2]=c[2]+p[2]*(l[2]-c[2]),g}function N(c,l,p){const w=p??new u(3);return w[0]=Math.max(c[0],l[0]),w[1]=Math.max(c[1],l[1]),w[2]=Math.max(c[2],l[2]),w}function U(c,l,p){const w=p??new u(3);return w[0]=Math.min(c[0],l[0]),w[1]=Math.min(c[1],l[1]),w[2]=Math.min(c[2],l[2]),w}function J(c,l,p){const w=p??new u(3);return w[0]=c[0]*l,w[1]=c[1]*l,w[2]=c[2]*l,w}const C=J;function Y(c,l,p){const w=p??new u(3);return w[0]=c[0]/l,w[1]=c[1]/l,w[2]=c[2]/l,w}function $(c,l){const p=l??new u(3);return p[0]=1/c[0],p[1]=1/c[1],p[2]=1/c[2],p}const K=$;function nt(c,l,p){const w=p??new u(3),g=c[2]*l[0]-c[0]*l[2],M=c[0]*l[1]-c[1]*l[0];return w[0]=c[1]*l[2]-c[2]*l[1],w[1]=g,w[2]=M,w}function ct(c,l){return c[0]*l[0]+c[1]*l[1]+c[2]*l[2]}function ft(c){const l=c[0],p=c[1],w=c[2];return Math.sqrt(l*l+p*p+w*w)}const Ft=ft;function W(c){const l=c[0],p=c[1],w=c[2];return l*l+p*p+w*w}const tt=W;function R(c,l){const p=c[0]-l[0],w=c[1]-l[1],g=c[2]-l[2];return Math.sqrt(p*p+w*w+g*g)}const Gt=R;function mt(c,l){const p=c[0]-l[0],w=c[1]-l[1],g=c[2]-l[2];return p*p+w*w+g*g}const It=mt;function yt(c,l){const p=l??new u(3),w=c[0],g=c[1],M=c[2],D=Math.sqrt(w*w+g*g+M*M);return D>1e-5?(p[0]=w/D,p[1]=g/D,p[2]=M/D):(p[0]=0,p[1]=0,p[2]=0),p}function Vt(c,l){const p=l??new u(3);return p[0]=-c[0],p[1]=-c[1],p[2]=-c[2],p}function et(c,l){const p=l??new u(3);return p[0]=c[0],p[1]=c[1],p[2]=c[2],p}const Et=et;function Tt(c,l,p){const w=p??new u(3);return w[0]=c[0]*l[0],w[1]=c[1]*l[1],w[2]=c[2]*l[2],w}const Xt=Tt;function St(c,l,p){const w=p??new u(3);return w[0]=c[0]/l[0],w[1]=c[1]/l[1],w[2]=c[2]/l[2],w}const Lt=St;function At(c=1,l){const p=l??new u(3),w=Math.random()*2*Math.PI,g=Math.random()*2-1,M=Math.sqrt(1-g*g)*c;return p[0]=Math.cos(w)*M,p[1]=Math.sin(w)*M,p[2]=g*c,p}function r(c){const l=c??new u(3);return l[0]=0,l[1]=0,l[2]=0,l}function d(c,l,p){const w=p??new u(3),g=c[0],M=c[1],D=c[2],q=l[3]*g+l[7]*M+l[11]*D+l[15]||1;return w[0]=(l[0]*g+l[4]*M+l[8]*D+l[12])/q,w[1]=(l[1]*g+l[5]*M+l[9]*D+l[13])/q,w[2]=(l[2]*g+l[6]*M+l[10]*D+l[14])/q,w}function e(c,l,p){const w=p??new u(3),g=c[0],M=c[1],D=c[2];return w[0]=g*l[0*4+0]+M*l[1*4+0]+D*l[2*4+0],w[1]=g*l[0*4+1]+M*l[1*4+1]+D*l[2*4+1],w[2]=g*l[0*4+2]+M*l[1*4+2]+D*l[2*4+2],w}function o(c,l,p){const w=p??new u(3),g=c[0],M=c[1],D=c[2];return w[0]=g*l[0]+M*l[4]+D*l[8],w[1]=g*l[1]+M*l[5]+D*l[9],w[2]=g*l[2]+M*l[6]+D*l[10],w}function f(c,l,p){const w=p??new u(3),g=l[0],M=l[1],D=l[2],q=l[3]*2,F=c[0],A=c[1],B=c[2],H=M*B-D*A,j=D*F-g*B,rt=g*A-M*F;return w[0]=F+H*q+(M*rt-D*j)*2,w[1]=A+j*q+(D*H-g*rt)*2,w[2]=B+rt*q+(g*j-M*H)*2,w}function h(c,l){const p=l??new u(3);return p[0]=c[12],p[1]=c[13],p[2]=c[14],p}function m(c,l,p){const w=p??new u(3),g=l*4;return w[0]=c[g+0],w[1]=c[g+1],w[2]=c[g+2],w}function t(c,l){const p=l??new u(3),w=c[0],g=c[1],M=c[2],D=c[4],q=c[5],F=c[6],A=c[8],B=c[9],H=c[10];return p[0]=Math.sqrt(w*w+g*g+M*M),p[1]=Math.sqrt(D*D+q*q+F*F),p[2]=Math.sqrt(A*A+B*B+H*H),p}function i(c,l,p,w){const g=w??new u(3),M=[],D=[];return M[0]=c[0]-l[0],M[1]=c[1]-l[1],M[2]=c[2]-l[2],D[0]=M[0],D[1]=M[1]*Math.cos(p)-M[2]*Math.sin(p),D[2]=M[1]*Math.sin(p)+M[2]*Math.cos(p),g[0]=D[0]+l[0],g[1]=D[1]+l[1],g[2]=D[2]+l[2],g}function n(c,l,p,w){const g=w??new u(3),M=[],D=[];return M[0]=c[0]-l[0],M[1]=c[1]-l[1],M[2]=c[2]-l[2],D[0]=M[2]*Math.sin(p)+M[0]*Math.cos(p),D[1]=M[1],D[2]=M[2]*Math.cos(p)-M[0]*Math.sin(p),g[0]=D[0]+l[0],g[1]=D[1]+l[1],g[2]=D[2]+l[2],g}function s(c,l,p,w){const g=w??new u(3),M=[],D=[];return M[0]=c[0]-l[0],M[1]=c[1]-l[1],M[2]=c[2]-l[2],D[0]=M[0]*Math.cos(p)-M[1]*Math.sin(p),D[1]=M[0]*Math.sin(p)+M[1]*Math.cos(p),D[2]=M[2],g[0]=D[0]+l[0],g[1]=D[1]+l[1],g[2]=D[2]+l[2],g}function a(c,l,p){const w=p??new u(3);return yt(c,w),J(w,l,w)}function v(c,l,p){const w=p??new u(3);return ft(c)>l?a(c,l,w):et(c,w)}function y(c,l,p){const w=p??new u(3);return _(c,l,.5,w)}return{create:x,fromValues:b,set:P,ceil:z,floor:S,round:L,clamp:X,add:O,addScaled:G,angle:T,subtract:I,sub:Z,equalsApproximately:Q,equals:st,lerp:_,lerpV:E,max:N,min:U,mulScalar:J,scale:C,divScalar:Y,inverse:$,invert:K,cross:nt,dot:ct,length:ft,len:Ft,lengthSq:W,lenSq:tt,distance:R,dist:Gt,distanceSq:mt,distSq:It,normalize:yt,negate:Vt,copy:et,clone:Et,multiply:Tt,mul:Xt,divide:St,div:Lt,random:At,zero:r,transformMat4:d,transformMat4Upper3x3:e,transformMat3:o,transformQuat:f,getTranslation:h,getAxis:m,getScaling:t,rotateX:i,rotateY:n,rotateZ:s,setLength:a,truncate:v,midpoint:y}}const qn=new Map;function pn(u){let x=qn.get(u);return x||(x=te(u),qn.set(u,x)),x}function ne(u){const x=Gn(u),b=pn(u);function P(r,d,e,o,f,h,m,t,i){const n=new u(12);return n[3]=0,n[7]=0,n[11]=0,r!==void 0&&(n[0]=r,d!==void 0&&(n[1]=d,e!==void 0&&(n[2]=e,o!==void 0&&(n[4]=o,f!==void 0&&(n[5]=f,h!==void 0&&(n[6]=h,m!==void 0&&(n[8]=m,t!==void 0&&(n[9]=t,i!==void 0&&(n[10]=i))))))))),n}function z(r,d,e,o,f,h,m,t,i,n){const s=n??new u(12);return s[0]=r,s[1]=d,s[2]=e,s[3]=0,s[4]=o,s[5]=f,s[6]=h,s[7]=0,s[8]=m,s[9]=t,s[10]=i,s[11]=0,s}function S(r,d){const e=d??new u(12);return e[0]=r[0],e[1]=r[1],e[2]=r[2],e[3]=0,e[4]=r[4],e[5]=r[5],e[6]=r[6],e[7]=0,e[8]=r[8],e[9]=r[9],e[10]=r[10],e[11]=0,e}function L(r,d){const e=d??new u(12),o=r[0],f=r[1],h=r[2],m=r[3],t=o+o,i=f+f,n=h+h,s=o*t,a=f*t,v=f*i,y=h*t,c=h*i,l=h*n,p=m*t,w=m*i,g=m*n;return e[0]=1-v-l,e[1]=a+g,e[2]=y-w,e[3]=0,e[4]=a-g,e[5]=1-s-l,e[6]=c+p,e[7]=0,e[8]=y+w,e[9]=c-p,e[10]=1-s-v,e[11]=0,e}function X(r,d){const e=d??new u(12);return e[0]=-r[0],e[1]=-r[1],e[2]=-r[2],e[4]=-r[4],e[5]=-r[5],e[6]=-r[6],e[8]=-r[8],e[9]=-r[9],e[10]=-r[10],e}function O(r,d){const e=d??new u(12);return e[0]=r[0],e[1]=r[1],e[2]=r[2],e[4]=r[4],e[5]=r[5],e[6]=r[6],e[8]=r[8],e[9]=r[9],e[10]=r[10],e}const G=O;function T(r,d){return Math.abs(r[0]-d[0])<k&&Math.abs(r[1]-d[1])<k&&Math.abs(r[2]-d[2])<k&&Math.abs(r[4]-d[4])<k&&Math.abs(r[5]-d[5])<k&&Math.abs(r[6]-d[6])<k&&Math.abs(r[8]-d[8])<k&&Math.abs(r[9]-d[9])<k&&Math.abs(r[10]-d[10])<k}function I(r,d){return r[0]===d[0]&&r[1]===d[1]&&r[2]===d[2]&&r[4]===d[4]&&r[5]===d[5]&&r[6]===d[6]&&r[8]===d[8]&&r[9]===d[9]&&r[10]===d[10]}function Z(r){const d=r??new u(12);return d[0]=1,d[1]=0,d[2]=0,d[4]=0,d[5]=1,d[6]=0,d[8]=0,d[9]=0,d[10]=1,d}function Q(r,d){const e=d??new u(12);if(e===r){let v;return v=r[1],r[1]=r[4],r[4]=v,v=r[2],r[2]=r[8],r[8]=v,v=r[6],r[6]=r[9],r[9]=v,e}const o=r[0*4+0],f=r[0*4+1],h=r[0*4+2],m=r[1*4+0],t=r[1*4+1],i=r[1*4+2],n=r[2*4+0],s=r[2*4+1],a=r[2*4+2];return e[0]=o,e[1]=m,e[2]=n,e[4]=f,e[5]=t,e[6]=s,e[8]=h,e[9]=i,e[10]=a,e}function st(r,d){const e=d??new u(12),o=r[0*4+0],f=r[0*4+1],h=r[0*4+2],m=r[1*4+0],t=r[1*4+1],i=r[1*4+2],n=r[2*4+0],s=r[2*4+1],a=r[2*4+2],v=a*t-i*s,y=-a*m+i*n,c=s*m-t*n,l=1/(o*v+f*y+h*c);return e[0]=v*l,e[1]=(-a*f+h*s)*l,e[2]=(i*f-h*t)*l,e[4]=y*l,e[5]=(a*o-h*n)*l,e[6]=(-i*o+h*m)*l,e[8]=c*l,e[9]=(-s*o+f*n)*l,e[10]=(t*o-f*m)*l,e}function _(r){const d=r[0],e=r[0*4+1],o=r[0*4+2],f=r[1*4+0],h=r[1*4+1],m=r[1*4+2],t=r[2*4+0],i=r[2*4+1],n=r[2*4+2];return d*(h*n-i*m)-f*(e*n-i*o)+t*(e*m-h*o)}const E=st;function N(r,d,e){const o=e??new u(12),f=r[0],h=r[1],m=r[2],t=r[4],i=r[5],n=r[6],s=r[8],a=r[9],v=r[10],y=d[0],c=d[1],l=d[2],p=d[4],w=d[5],g=d[6],M=d[8],D=d[9],q=d[10];return o[0]=f*y+t*c+s*l,o[1]=h*y+i*c+a*l,o[2]=m*y+n*c+v*l,o[4]=f*p+t*w+s*g,o[5]=h*p+i*w+a*g,o[6]=m*p+n*w+v*g,o[8]=f*M+t*D+s*q,o[9]=h*M+i*D+a*q,o[10]=m*M+n*D+v*q,o}const U=N;function J(r,d,e){const o=e??Z();return r!==o&&(o[0]=r[0],o[1]=r[1],o[2]=r[2],o[4]=r[4],o[5]=r[5],o[6]=r[6]),o[8]=d[0],o[9]=d[1],o[10]=1,o}function C(r,d){const e=d??x.create();return e[0]=r[8],e[1]=r[9],e}function Y(r,d,e){const o=e??x.create(),f=d*4;return o[0]=r[f+0],o[1]=r[f+1],o}function $(r,d,e,o){const f=o===r?r:O(r,o),h=e*4;return f[h+0]=d[0],f[h+1]=d[1],f}function K(r,d){const e=d??x.create(),o=r[0],f=r[1],h=r[4],m=r[5];return e[0]=Math.sqrt(o*o+f*f),e[1]=Math.sqrt(h*h+m*m),e}function nt(r,d){const e=d??b.create(),o=r[0],f=r[1],h=r[2],m=r[4],t=r[5],i=r[6],n=r[8],s=r[9],a=r[10];return e[0]=Math.sqrt(o*o+f*f+h*h),e[1]=Math.sqrt(m*m+t*t+i*i),e[2]=Math.sqrt(n*n+s*s+a*a),e}function ct(r,d){const e=d??new u(12);return e[0]=1,e[1]=0,e[2]=0,e[4]=0,e[5]=1,e[6]=0,e[8]=r[0],e[9]=r[1],e[10]=1,e}function ft(r,d,e){const o=e??new u(12),f=d[0],h=d[1],m=r[0],t=r[1],i=r[2],n=r[1*4+0],s=r[1*4+1],a=r[1*4+2],v=r[2*4+0],y=r[2*4+1],c=r[2*4+2];return r!==o&&(o[0]=m,o[1]=t,o[2]=i,o[4]=n,o[5]=s,o[6]=a),o[8]=m*f+n*h+v,o[9]=t*f+s*h+y,o[10]=i*f+a*h+c,o}function Ft(r,d){const e=d??new u(12),o=Math.cos(r),f=Math.sin(r);return e[0]=o,e[1]=f,e[2]=0,e[4]=-f,e[5]=o,e[6]=0,e[8]=0,e[9]=0,e[10]=1,e}function W(r,d,e){const o=e??new u(12),f=r[0*4+0],h=r[0*4+1],m=r[0*4+2],t=r[1*4+0],i=r[1*4+1],n=r[1*4+2],s=Math.cos(d),a=Math.sin(d);return o[0]=s*f+a*t,o[1]=s*h+a*i,o[2]=s*m+a*n,o[4]=s*t-a*f,o[5]=s*i-a*h,o[6]=s*n-a*m,r!==o&&(o[8]=r[8],o[9]=r[9],o[10]=r[10]),o}function tt(r,d){const e=d??new u(12),o=Math.cos(r),f=Math.sin(r);return e[0]=1,e[1]=0,e[2]=0,e[4]=0,e[5]=o,e[6]=f,e[8]=0,e[9]=-f,e[10]=o,e}function R(r,d,e){const o=e??new u(12),f=r[4],h=r[5],m=r[6],t=r[8],i=r[9],n=r[10],s=Math.cos(d),a=Math.sin(d);return o[4]=s*f+a*t,o[5]=s*h+a*i,o[6]=s*m+a*n,o[8]=s*t-a*f,o[9]=s*i-a*h,o[10]=s*n-a*m,r!==o&&(o[0]=r[0],o[1]=r[1],o[2]=r[2]),o}function Gt(r,d){const e=d??new u(12),o=Math.cos(r),f=Math.sin(r);return e[0]=o,e[1]=0,e[2]=-f,e[4]=0,e[5]=1,e[6]=0,e[8]=f,e[9]=0,e[10]=o,e}function mt(r,d,e){const o=e??new u(12),f=r[0*4+0],h=r[0*4+1],m=r[0*4+2],t=r[2*4+0],i=r[2*4+1],n=r[2*4+2],s=Math.cos(d),a=Math.sin(d);return o[0]=s*f-a*t,o[1]=s*h-a*i,o[2]=s*m-a*n,o[8]=s*t+a*f,o[9]=s*i+a*h,o[10]=s*n+a*m,r!==o&&(o[4]=r[4],o[5]=r[5],o[6]=r[6]),o}const It=Ft,yt=W;function Vt(r,d){const e=d??new u(12);return e[0]=r[0],e[1]=0,e[2]=0,e[4]=0,e[5]=r[1],e[6]=0,e[8]=0,e[9]=0,e[10]=1,e}function et(r,d,e){const o=e??new u(12),f=d[0],h=d[1];return o[0]=f*r[0*4+0],o[1]=f*r[0*4+1],o[2]=f*r[0*4+2],o[4]=h*r[1*4+0],o[5]=h*r[1*4+1],o[6]=h*r[1*4+2],r!==o&&(o[8]=r[8],o[9]=r[9],o[10]=r[10]),o}function Et(r,d){const e=d??new u(12);return e[0]=r[0],e[1]=0,e[2]=0,e[4]=0,e[5]=r[1],e[6]=0,e[8]=0,e[9]=0,e[10]=r[2],e}function Tt(r,d,e){const o=e??new u(12),f=d[0],h=d[1],m=d[2];return o[0]=f*r[0*4+0],o[1]=f*r[0*4+1],o[2]=f*r[0*4+2],o[4]=h*r[1*4+0],o[5]=h*r[1*4+1],o[6]=h*r[1*4+2],o[8]=m*r[2*4+0],o[9]=m*r[2*4+1],o[10]=m*r[2*4+2],o}function Xt(r,d){const e=d??new u(12);return e[0]=r,e[1]=0,e[2]=0,e[4]=0,e[5]=r,e[6]=0,e[8]=0,e[9]=0,e[10]=1,e}function St(r,d,e){const o=e??new u(12);return o[0]=d*r[0*4+0],o[1]=d*r[0*4+1],o[2]=d*r[0*4+2],o[4]=d*r[1*4+0],o[5]=d*r[1*4+1],o[6]=d*r[1*4+2],r!==o&&(o[8]=r[8],o[9]=r[9],o[10]=r[10]),o}function Lt(r,d){const e=d??new u(12);return e[0]=r,e[1]=0,e[2]=0,e[4]=0,e[5]=r,e[6]=0,e[8]=0,e[9]=0,e[10]=r,e}function At(r,d,e){const o=e??new u(12);return o[0]=d*r[0*4+0],o[1]=d*r[0*4+1],o[2]=d*r[0*4+2],o[4]=d*r[1*4+0],o[5]=d*r[1*4+1],o[6]=d*r[1*4+2],o[8]=d*r[2*4+0],o[9]=d*r[2*4+1],o[10]=d*r[2*4+2],o}return{clone:G,create:P,set:z,fromMat4:S,fromQuat:L,negate:X,copy:O,equalsApproximately:T,equals:I,identity:Z,transpose:Q,inverse:st,invert:E,determinant:_,mul:U,multiply:N,setTranslation:J,getTranslation:C,getAxis:Y,setAxis:$,getScaling:K,get3DScaling:nt,translation:ct,translate:ft,rotation:Ft,rotate:W,rotationX:tt,rotateX:R,rotationY:Gt,rotateY:mt,rotationZ:It,rotateZ:yt,scaling:Vt,scale:et,uniformScaling:Xt,uniformScale:St,scaling3D:Et,scale3D:Tt,uniformScaling3D:Lt,uniformScale3D:At}}const Bn=new Map;function ee(u){let x=Bn.get(u);return x||(x=ne(u),Bn.set(u,x)),x}function se(u){const x=pn(u);function b(t,i,n,s,a,v,y,c,l,p,w,g,M,D,q,F){const A=new u(16);return t!==void 0&&(A[0]=t,i!==void 0&&(A[1]=i,n!==void 0&&(A[2]=n,s!==void 0&&(A[3]=s,a!==void 0&&(A[4]=a,v!==void 0&&(A[5]=v,y!==void 0&&(A[6]=y,c!==void 0&&(A[7]=c,l!==void 0&&(A[8]=l,p!==void 0&&(A[9]=p,w!==void 0&&(A[10]=w,g!==void 0&&(A[11]=g,M!==void 0&&(A[12]=M,D!==void 0&&(A[13]=D,q!==void 0&&(A[14]=q,F!==void 0&&(A[15]=F)))))))))))))))),A}function P(t,i,n,s,a,v,y,c,l,p,w,g,M,D,q,F,A){const B=A??new u(16);return B[0]=t,B[1]=i,B[2]=n,B[3]=s,B[4]=a,B[5]=v,B[6]=y,B[7]=c,B[8]=l,B[9]=p,B[10]=w,B[11]=g,B[12]=M,B[13]=D,B[14]=q,B[15]=F,B}function z(t,i){const n=i??new u(16);return n[0]=t[0],n[1]=t[1],n[2]=t[2],n[3]=0,n[4]=t[4],n[5]=t[5],n[6]=t[6],n[7]=0,n[8]=t[8],n[9]=t[9],n[10]=t[10],n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function S(t,i){const n=i??new u(16),s=t[0],a=t[1],v=t[2],y=t[3],c=s+s,l=a+a,p=v+v,w=s*c,g=a*c,M=a*l,D=v*c,q=v*l,F=v*p,A=y*c,B=y*l,H=y*p;return n[0]=1-M-F,n[1]=g+H,n[2]=D-B,n[3]=0,n[4]=g-H,n[5]=1-w-F,n[6]=q+A,n[7]=0,n[8]=D+B,n[9]=q-A,n[10]=1-w-M,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function L(t,i){const n=i??new u(16);return n[0]=-t[0],n[1]=-t[1],n[2]=-t[2],n[3]=-t[3],n[4]=-t[4],n[5]=-t[5],n[6]=-t[6],n[7]=-t[7],n[8]=-t[8],n[9]=-t[9],n[10]=-t[10],n[11]=-t[11],n[12]=-t[12],n[13]=-t[13],n[14]=-t[14],n[15]=-t[15],n}function X(t,i){const n=i??new u(16);return n[0]=t[0],n[1]=t[1],n[2]=t[2],n[3]=t[3],n[4]=t[4],n[5]=t[5],n[6]=t[6],n[7]=t[7],n[8]=t[8],n[9]=t[9],n[10]=t[10],n[11]=t[11],n[12]=t[12],n[13]=t[13],n[14]=t[14],n[15]=t[15],n}const O=X;function G(t,i){return Math.abs(t[0]-i[0])<k&&Math.abs(t[1]-i[1])<k&&Math.abs(t[2]-i[2])<k&&Math.abs(t[3]-i[3])<k&&Math.abs(t[4]-i[4])<k&&Math.abs(t[5]-i[5])<k&&Math.abs(t[6]-i[6])<k&&Math.abs(t[7]-i[7])<k&&Math.abs(t[8]-i[8])<k&&Math.abs(t[9]-i[9])<k&&Math.abs(t[10]-i[10])<k&&Math.abs(t[11]-i[11])<k&&Math.abs(t[12]-i[12])<k&&Math.abs(t[13]-i[13])<k&&Math.abs(t[14]-i[14])<k&&Math.abs(t[15]-i[15])<k}function T(t,i){return t[0]===i[0]&&t[1]===i[1]&&t[2]===i[2]&&t[3]===i[3]&&t[4]===i[4]&&t[5]===i[5]&&t[6]===i[6]&&t[7]===i[7]&&t[8]===i[8]&&t[9]===i[9]&&t[10]===i[10]&&t[11]===i[11]&&t[12]===i[12]&&t[13]===i[13]&&t[14]===i[14]&&t[15]===i[15]}function I(t){const i=t??new u(16);return i[0]=1,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=1,i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[10]=1,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,i}function Z(t,i){const n=i??new u(16);if(n===t){let j;return j=t[1],t[1]=t[4],t[4]=j,j=t[2],t[2]=t[8],t[8]=j,j=t[3],t[3]=t[12],t[12]=j,j=t[6],t[6]=t[9],t[9]=j,j=t[7],t[7]=t[13],t[13]=j,j=t[11],t[11]=t[14],t[14]=j,n}const s=t[0*4+0],a=t[0*4+1],v=t[0*4+2],y=t[0*4+3],c=t[1*4+0],l=t[1*4+1],p=t[1*4+2],w=t[1*4+3],g=t[2*4+0],M=t[2*4+1],D=t[2*4+2],q=t[2*4+3],F=t[3*4+0],A=t[3*4+1],B=t[3*4+2],H=t[3*4+3];return n[0]=s,n[1]=c,n[2]=g,n[3]=F,n[4]=a,n[5]=l,n[6]=M,n[7]=A,n[8]=v,n[9]=p,n[10]=D,n[11]=B,n[12]=y,n[13]=w,n[14]=q,n[15]=H,n}function Q(t,i){const n=i??new u(16),s=t[0*4+0],a=t[0*4+1],v=t[0*4+2],y=t[0*4+3],c=t[1*4+0],l=t[1*4+1],p=t[1*4+2],w=t[1*4+3],g=t[2*4+0],M=t[2*4+1],D=t[2*4+2],q=t[2*4+3],F=t[3*4+0],A=t[3*4+1],B=t[3*4+2],H=t[3*4+3],j=D*H,rt=B*q,at=p*H,lt=B*w,dt=p*q,ht=D*w,pt=v*H,vt=B*y,wt=v*q,xt=D*y,Mt=v*w,Dt=p*y,zt=g*A,bt=F*M,qt=c*A,Bt=F*l,_t=c*M,Kt=g*l,Ct=s*A,tn=F*a,nn=s*M,en=g*a,sn=s*l,rn=c*a,bn=j*l+lt*M+dt*A-(rt*l+at*M+ht*A),Pn=rt*a+pt*M+xt*A-(j*a+vt*M+wt*A),Tn=at*a+vt*l+Mt*A-(lt*a+pt*l+Dt*A),Sn=ht*a+wt*l+Dt*M-(dt*a+xt*l+Mt*M),gt=1/(s*bn+c*Pn+g*Tn+F*Sn);return n[0]=gt*bn,n[1]=gt*Pn,n[2]=gt*Tn,n[3]=gt*Sn,n[4]=gt*(rt*c+at*g+ht*F-(j*c+lt*g+dt*F)),n[5]=gt*(j*s+vt*g+wt*F-(rt*s+pt*g+xt*F)),n[6]=gt*(lt*s+pt*c+Dt*F-(at*s+vt*c+Mt*F)),n[7]=gt*(dt*s+xt*c+Mt*g-(ht*s+wt*c+Dt*g)),n[8]=gt*(zt*w+Bt*q+_t*H-(bt*w+qt*q+Kt*H)),n[9]=gt*(bt*y+Ct*q+en*H-(zt*y+tn*q+nn*H)),n[10]=gt*(qt*y+tn*w+sn*H-(Bt*y+Ct*w+rn*H)),n[11]=gt*(Kt*y+nn*w+rn*q-(_t*y+en*w+sn*q)),n[12]=gt*(qt*D+Kt*B+bt*p-(_t*B+zt*p+Bt*D)),n[13]=gt*(nn*B+zt*v+tn*D-(Ct*D+en*B+bt*v)),n[14]=gt*(Ct*p+rn*B+Bt*v-(sn*B+qt*v+tn*p)),n[15]=gt*(sn*D+_t*v+en*p-(nn*p+rn*D+Kt*v)),n}function st(t){const i=t[0],n=t[0*4+1],s=t[0*4+2],a=t[0*4+3],v=t[1*4+0],y=t[1*4+1],c=t[1*4+2],l=t[1*4+3],p=t[2*4+0],w=t[2*4+1],g=t[2*4+2],M=t[2*4+3],D=t[3*4+0],q=t[3*4+1],F=t[3*4+2],A=t[3*4+3],B=g*A,H=F*M,j=c*A,rt=F*l,at=c*M,lt=g*l,dt=s*A,ht=F*a,pt=s*M,vt=g*a,wt=s*l,xt=c*a,Mt=B*y+rt*w+at*q-(H*y+j*w+lt*q),Dt=H*n+dt*w+vt*q-(B*n+ht*w+pt*q),zt=j*n+ht*y+wt*q-(rt*n+dt*y+xt*q),bt=lt*n+pt*y+xt*w-(at*n+vt*y+wt*w);return i*Mt+v*Dt+p*zt+D*bt}const _=Q;function E(t,i,n){const s=n??new u(16),a=t[0],v=t[1],y=t[2],c=t[3],l=t[4],p=t[5],w=t[6],g=t[7],M=t[8],D=t[9],q=t[10],F=t[11],A=t[12],B=t[13],H=t[14],j=t[15],rt=i[0],at=i[1],lt=i[2],dt=i[3],ht=i[4],pt=i[5],vt=i[6],wt=i[7],xt=i[8],Mt=i[9],Dt=i[10],zt=i[11],bt=i[12],qt=i[13],Bt=i[14],_t=i[15];return s[0]=a*rt+l*at+M*lt+A*dt,s[1]=v*rt+p*at+D*lt+B*dt,s[2]=y*rt+w*at+q*lt+H*dt,s[3]=c*rt+g*at+F*lt+j*dt,s[4]=a*ht+l*pt+M*vt+A*wt,s[5]=v*ht+p*pt+D*vt+B*wt,s[6]=y*ht+w*pt+q*vt+H*wt,s[7]=c*ht+g*pt+F*vt+j*wt,s[8]=a*xt+l*Mt+M*Dt+A*zt,s[9]=v*xt+p*Mt+D*Dt+B*zt,s[10]=y*xt+w*Mt+q*Dt+H*zt,s[11]=c*xt+g*Mt+F*Dt+j*zt,s[12]=a*bt+l*qt+M*Bt+A*_t,s[13]=v*bt+p*qt+D*Bt+B*_t,s[14]=y*bt+w*qt+q*Bt+H*_t,s[15]=c*bt+g*qt+F*Bt+j*_t,s}const N=E;function U(t,i,n){const s=n??I();return t!==s&&(s[0]=t[0],s[1]=t[1],s[2]=t[2],s[3]=t[3],s[4]=t[4],s[5]=t[5],s[6]=t[6],s[7]=t[7],s[8]=t[8],s[9]=t[9],s[10]=t[10],s[11]=t[11]),s[12]=i[0],s[13]=i[1],s[14]=i[2],s[15]=1,s}function J(t,i){const n=i??x.create();return n[0]=t[12],n[1]=t[13],n[2]=t[14],n}function C(t,i,n){const s=n??x.create(),a=i*4;return s[0]=t[a+0],s[1]=t[a+1],s[2]=t[a+2],s}function Y(t,i,n,s){const a=s===t?s:X(t,s),v=n*4;return a[v+0]=i[0],a[v+1]=i[1],a[v+2]=i[2],a}function $(t,i){const n=i??x.create(),s=t[0],a=t[1],v=t[2],y=t[4],c=t[5],l=t[6],p=t[8],w=t[9],g=t[10];return n[0]=Math.sqrt(s*s+a*a+v*v),n[1]=Math.sqrt(y*y+c*c+l*l),n[2]=Math.sqrt(p*p+w*w+g*g),n}function K(t,i,n,s,a){const v=a??new u(16),y=Math.tan(Math.PI*.5-.5*t);if(v[0]=y/i,v[1]=0,v[2]=0,v[3]=0,v[4]=0,v[5]=y,v[6]=0,v[7]=0,v[8]=0,v[9]=0,v[11]=-1,v[12]=0,v[13]=0,v[15]=0,Number.isFinite(s)){const c=1/(n-s);v[10]=s*c,v[14]=s*n*c}else v[10]=-1,v[14]=-n;return v}function nt(t,i,n,s=1/0,a){const v=a??new u(16),y=1/Math.tan(t*.5);if(v[0]=y/i,v[1]=0,v[2]=0,v[3]=0,v[4]=0,v[5]=y,v[6]=0,v[7]=0,v[8]=0,v[9]=0,v[11]=-1,v[12]=0,v[13]=0,v[15]=0,s===1/0)v[10]=0,v[14]=n;else{const c=1/(s-n);v[10]=n*c,v[14]=s*n*c}return v}function ct(t,i,n,s,a,v,y){const c=y??new u(16);return c[0]=2/(i-t),c[1]=0,c[2]=0,c[3]=0,c[4]=0,c[5]=2/(s-n),c[6]=0,c[7]=0,c[8]=0,c[9]=0,c[10]=1/(a-v),c[11]=0,c[12]=(i+t)/(t-i),c[13]=(s+n)/(n-s),c[14]=a/(a-v),c[15]=1,c}function ft(t,i,n,s,a,v,y){const c=y??new u(16),l=i-t,p=s-n,w=a-v;return c[0]=2*a/l,c[1]=0,c[2]=0,c[3]=0,c[4]=0,c[5]=2*a/p,c[6]=0,c[7]=0,c[8]=(t+i)/l,c[9]=(s+n)/p,c[10]=v/w,c[11]=-1,c[12]=0,c[13]=0,c[14]=a*v/w,c[15]=0,c}function Ft(t,i,n,s,a,v=1/0,y){const c=y??new u(16),l=i-t,p=s-n;if(c[0]=2*a/l,c[1]=0,c[2]=0,c[3]=0,c[4]=0,c[5]=2*a/p,c[6]=0,c[7]=0,c[8]=(t+i)/l,c[9]=(s+n)/p,c[11]=-1,c[12]=0,c[13]=0,c[15]=0,v===1/0)c[10]=0,c[14]=a;else{const w=1/(v-a);c[10]=a*w,c[14]=v*a*w}return c}const W=x.create(),tt=x.create(),R=x.create();function Gt(t,i,n,s){const a=s??new u(16);return x.normalize(x.subtract(i,t,R),R),x.normalize(x.cross(n,R,W),W),x.normalize(x.cross(R,W,tt),tt),a[0]=W[0],a[1]=W[1],a[2]=W[2],a[3]=0,a[4]=tt[0],a[5]=tt[1],a[6]=tt[2],a[7]=0,a[8]=R[0],a[9]=R[1],a[10]=R[2],a[11]=0,a[12]=t[0],a[13]=t[1],a[14]=t[2],a[15]=1,a}function mt(t,i,n,s){const a=s??new u(16);return x.normalize(x.subtract(t,i,R),R),x.normalize(x.cross(n,R,W),W),x.normalize(x.cross(R,W,tt),tt),a[0]=W[0],a[1]=W[1],a[2]=W[2],a[3]=0,a[4]=tt[0],a[5]=tt[1],a[6]=tt[2],a[7]=0,a[8]=R[0],a[9]=R[1],a[10]=R[2],a[11]=0,a[12]=t[0],a[13]=t[1],a[14]=t[2],a[15]=1,a}function It(t,i,n,s){const a=s??new u(16);return x.normalize(x.subtract(t,i,R),R),x.normalize(x.cross(n,R,W),W),x.normalize(x.cross(R,W,tt),tt),a[0]=W[0],a[1]=tt[0],a[2]=R[0],a[3]=0,a[4]=W[1],a[5]=tt[1],a[6]=R[1],a[7]=0,a[8]=W[2],a[9]=tt[2],a[10]=R[2],a[11]=0,a[12]=-(W[0]*t[0]+W[1]*t[1]+W[2]*t[2]),a[13]=-(tt[0]*t[0]+tt[1]*t[1]+tt[2]*t[2]),a[14]=-(R[0]*t[0]+R[1]*t[1]+R[2]*t[2]),a[15]=1,a}function yt(t,i){const n=i??new u(16);return n[0]=1,n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=1,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[10]=1,n[11]=0,n[12]=t[0],n[13]=t[1],n[14]=t[2],n[15]=1,n}function Vt(t,i,n){const s=n??new u(16),a=i[0],v=i[1],y=i[2],c=t[0],l=t[1],p=t[2],w=t[3],g=t[1*4+0],M=t[1*4+1],D=t[1*4+2],q=t[1*4+3],F=t[2*4+0],A=t[2*4+1],B=t[2*4+2],H=t[2*4+3],j=t[3*4+0],rt=t[3*4+1],at=t[3*4+2],lt=t[3*4+3];return t!==s&&(s[0]=c,s[1]=l,s[2]=p,s[3]=w,s[4]=g,s[5]=M,s[6]=D,s[7]=q,s[8]=F,s[9]=A,s[10]=B,s[11]=H),s[12]=c*a+g*v+F*y+j,s[13]=l*a+M*v+A*y+rt,s[14]=p*a+D*v+B*y+at,s[15]=w*a+q*v+H*y+lt,s}function et(t,i){const n=i??new u(16),s=Math.cos(t),a=Math.sin(t);return n[0]=1,n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=s,n[6]=a,n[7]=0,n[8]=0,n[9]=-a,n[10]=s,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function Et(t,i,n){const s=n??new u(16),a=t[4],v=t[5],y=t[6],c=t[7],l=t[8],p=t[9],w=t[10],g=t[11],M=Math.cos(i),D=Math.sin(i);return s[4]=M*a+D*l,s[5]=M*v+D*p,s[6]=M*y+D*w,s[7]=M*c+D*g,s[8]=M*l-D*a,s[9]=M*p-D*v,s[10]=M*w-D*y,s[11]=M*g-D*c,t!==s&&(s[0]=t[0],s[1]=t[1],s[2]=t[2],s[3]=t[3],s[12]=t[12],s[13]=t[13],s[14]=t[14],s[15]=t[15]),s}function Tt(t,i){const n=i??new u(16),s=Math.cos(t),a=Math.sin(t);return n[0]=s,n[1]=0,n[2]=-a,n[3]=0,n[4]=0,n[5]=1,n[6]=0,n[7]=0,n[8]=a,n[9]=0,n[10]=s,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function Xt(t,i,n){const s=n??new u(16),a=t[0*4+0],v=t[0*4+1],y=t[0*4+2],c=t[0*4+3],l=t[2*4+0],p=t[2*4+1],w=t[2*4+2],g=t[2*4+3],M=Math.cos(i),D=Math.sin(i);return s[0]=M*a-D*l,s[1]=M*v-D*p,s[2]=M*y-D*w,s[3]=M*c-D*g,s[8]=M*l+D*a,s[9]=M*p+D*v,s[10]=M*w+D*y,s[11]=M*g+D*c,t!==s&&(s[4]=t[4],s[5]=t[5],s[6]=t[6],s[7]=t[7],s[12]=t[12],s[13]=t[13],s[14]=t[14],s[15]=t[15]),s}function St(t,i){const n=i??new u(16),s=Math.cos(t),a=Math.sin(t);return n[0]=s,n[1]=a,n[2]=0,n[3]=0,n[4]=-a,n[5]=s,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[10]=1,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function Lt(t,i,n){const s=n??new u(16),a=t[0*4+0],v=t[0*4+1],y=t[0*4+2],c=t[0*4+3],l=t[1*4+0],p=t[1*4+1],w=t[1*4+2],g=t[1*4+3],M=Math.cos(i),D=Math.sin(i);return s[0]=M*a+D*l,s[1]=M*v+D*p,s[2]=M*y+D*w,s[3]=M*c+D*g,s[4]=M*l-D*a,s[5]=M*p-D*v,s[6]=M*w-D*y,s[7]=M*g-D*c,t!==s&&(s[8]=t[8],s[9]=t[9],s[10]=t[10],s[11]=t[11],s[12]=t[12],s[13]=t[13],s[14]=t[14],s[15]=t[15]),s}function At(t,i,n){const s=n??new u(16);let a=t[0],v=t[1],y=t[2];const c=Math.sqrt(a*a+v*v+y*y);a/=c,v/=c,y/=c;const l=a*a,p=v*v,w=y*y,g=Math.cos(i),M=Math.sin(i),D=1-g;return s[0]=l+(1-l)*g,s[1]=a*v*D+y*M,s[2]=a*y*D-v*M,s[3]=0,s[4]=a*v*D-y*M,s[5]=p+(1-p)*g,s[6]=v*y*D+a*M,s[7]=0,s[8]=a*y*D+v*M,s[9]=v*y*D-a*M,s[10]=w+(1-w)*g,s[11]=0,s[12]=0,s[13]=0,s[14]=0,s[15]=1,s}const r=At;function d(t,i,n,s){const a=s??new u(16);let v=i[0],y=i[1],c=i[2];const l=Math.sqrt(v*v+y*y+c*c);v/=l,y/=l,c/=l;const p=v*v,w=y*y,g=c*c,M=Math.cos(n),D=Math.sin(n),q=1-M,F=p+(1-p)*M,A=v*y*q+c*D,B=v*c*q-y*D,H=v*y*q-c*D,j=w+(1-w)*M,rt=y*c*q+v*D,at=v*c*q+y*D,lt=y*c*q-v*D,dt=g+(1-g)*M,ht=t[0],pt=t[1],vt=t[2],wt=t[3],xt=t[4],Mt=t[5],Dt=t[6],zt=t[7],bt=t[8],qt=t[9],Bt=t[10],_t=t[11];return a[0]=F*ht+A*xt+B*bt,a[1]=F*pt+A*Mt+B*qt,a[2]=F*vt+A*Dt+B*Bt,a[3]=F*wt+A*zt+B*_t,a[4]=H*ht+j*xt+rt*bt,a[5]=H*pt+j*Mt+rt*qt,a[6]=H*vt+j*Dt+rt*Bt,a[7]=H*wt+j*zt+rt*_t,a[8]=at*ht+lt*xt+dt*bt,a[9]=at*pt+lt*Mt+dt*qt,a[10]=at*vt+lt*Dt+dt*Bt,a[11]=at*wt+lt*zt+dt*_t,t!==a&&(a[12]=t[12],a[13]=t[13],a[14]=t[14],a[15]=t[15]),a}const e=d;function o(t,i){const n=i??new u(16);return n[0]=t[0],n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=t[1],n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[10]=t[2],n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function f(t,i,n){const s=n??new u(16),a=i[0],v=i[1],y=i[2];return s[0]=a*t[0*4+0],s[1]=a*t[0*4+1],s[2]=a*t[0*4+2],s[3]=a*t[0*4+3],s[4]=v*t[1*4+0],s[5]=v*t[1*4+1],s[6]=v*t[1*4+2],s[7]=v*t[1*4+3],s[8]=y*t[2*4+0],s[9]=y*t[2*4+1],s[10]=y*t[2*4+2],s[11]=y*t[2*4+3],t!==s&&(s[12]=t[12],s[13]=t[13],s[14]=t[14],s[15]=t[15]),s}function h(t,i){const n=i??new u(16);return n[0]=t,n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=t,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[10]=t,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function m(t,i,n){const s=n??new u(16);return s[0]=i*t[0*4+0],s[1]=i*t[0*4+1],s[2]=i*t[0*4+2],s[3]=i*t[0*4+3],s[4]=i*t[1*4+0],s[5]=i*t[1*4+1],s[6]=i*t[1*4+2],s[7]=i*t[1*4+3],s[8]=i*t[2*4+0],s[9]=i*t[2*4+1],s[10]=i*t[2*4+2],s[11]=i*t[2*4+3],t!==s&&(s[12]=t[12],s[13]=t[13],s[14]=t[14],s[15]=t[15]),s}return{create:b,set:P,fromMat3:z,fromQuat:S,negate:L,copy:X,clone:O,equalsApproximately:G,equals:T,identity:I,transpose:Z,inverse:Q,determinant:st,invert:_,multiply:E,mul:N,setTranslation:U,getTranslation:J,getAxis:C,setAxis:Y,getScaling:$,perspective:K,perspectiveReverseZ:nt,ortho:ct,frustum:ft,frustumReverseZ:Ft,aim:Gt,cameraAim:mt,lookAt:It,translation:yt,translate:Vt,rotationX:et,rotateX:Et,rotationY:Tt,rotateY:Xt,rotationZ:St,rotateZ:Lt,axisRotation:At,rotation:r,axisRotate:d,rotate:e,scaling:o,scale:f,uniformScaling:h,uniformScale:m}}const _n=new Map;function re(u){let x=_n.get(u);return x||(x=se(u),_n.set(u,x)),x}function oe(u){const x=pn(u);function b(r,d,e,o){const f=new u(4);return r!==void 0&&(f[0]=r,d!==void 0&&(f[1]=d,e!==void 0&&(f[2]=e,o!==void 0&&(f[3]=o)))),f}const P=b;function z(r,d,e,o,f){const h=f??new u(4);return h[0]=r,h[1]=d,h[2]=e,h[3]=o,h}function S(r,d,e){const o=e??new u(4),f=d*.5,h=Math.sin(f);return o[0]=h*r[0],o[1]=h*r[1],o[2]=h*r[2],o[3]=Math.cos(f),o}function L(r,d){const e=d??x.create(3),o=Math.acos(r[3])*2,f=Math.sin(o*.5);return f>k?(e[0]=r[0]/f,e[1]=r[1]/f,e[2]=r[2]/f):(e[0]=1,e[1]=0,e[2]=0),{angle:o,axis:e}}function X(r,d){const e=ft(r,d);return Math.acos(2*e*e-1)}function O(r,d,e){const o=e??new u(4),f=r[0],h=r[1],m=r[2],t=r[3],i=d[0],n=d[1],s=d[2],a=d[3];return o[0]=f*a+t*i+h*s-m*n,o[1]=h*a+t*n+m*i-f*s,o[2]=m*a+t*s+f*n-h*i,o[3]=t*a-f*i-h*n-m*s,o}const G=O;function T(r,d,e){const o=e??new u(4),f=d*.5,h=r[0],m=r[1],t=r[2],i=r[3],n=Math.sin(f),s=Math.cos(f);return o[0]=h*s+i*n,o[1]=m*s+t*n,o[2]=t*s-m*n,o[3]=i*s-h*n,o}function I(r,d,e){const o=e??new u(4),f=d*.5,h=r[0],m=r[1],t=r[2],i=r[3],n=Math.sin(f),s=Math.cos(f);return o[0]=h*s-t*n,o[1]=m*s+i*n,o[2]=t*s+h*n,o[3]=i*s-m*n,o}function Z(r,d,e){const o=e??new u(4),f=d*.5,h=r[0],m=r[1],t=r[2],i=r[3],n=Math.sin(f),s=Math.cos(f);return o[0]=h*s+m*n,o[1]=m*s-h*n,o[2]=t*s+i*n,o[3]=i*s-t*n,o}function Q(r,d,e,o){const f=o??new u(4),h=r[0],m=r[1],t=r[2],i=r[3];let n=d[0],s=d[1],a=d[2],v=d[3],y=h*n+m*s+t*a+i*v;y<0&&(y=-y,n=-n,s=-s,a=-a,v=-v);let c,l;if(1-y>k){const p=Math.acos(y),w=Math.sin(p);c=Math.sin((1-e)*p)/w,l=Math.sin(e*p)/w}else c=1-e,l=e;return f[0]=c*h+l*n,f[1]=c*m+l*s,f[2]=c*t+l*a,f[3]=c*i+l*v,f}function st(r,d){const e=d??new u(4),o=r[0],f=r[1],h=r[2],m=r[3],t=o*o+f*f+h*h+m*m,i=t?1/t:0;return e[0]=-o*i,e[1]=-f*i,e[2]=-h*i,e[3]=m*i,e}function _(r,d){const e=d??new u(4);return e[0]=-r[0],e[1]=-r[1],e[2]=-r[2],e[3]=r[3],e}function E(r,d){const e=d??new u(4),o=r[0]+r[5]+r[10];if(o>0){const f=Math.sqrt(o+1);e[3]=.5*f;const h=.5/f;e[0]=(r[6]-r[9])*h,e[1]=(r[8]-r[2])*h,e[2]=(r[1]-r[4])*h}else{let f=0;r[5]>r[0]&&(f=1),r[10]>r[f*4+f]&&(f=2);const h=(f+1)%3,m=(f+2)%3,t=Math.sqrt(r[f*4+f]-r[h*4+h]-r[m*4+m]+1);e[f]=.5*t;const i=.5/t;e[3]=(r[h*4+m]-r[m*4+h])*i,e[h]=(r[h*4+f]+r[f*4+h])*i,e[m]=(r[m*4+f]+r[f*4+m])*i}return e}function N(r,d,e,o,f){const h=f??new u(4),m=r*.5,t=d*.5,i=e*.5,n=Math.sin(m),s=Math.cos(m),a=Math.sin(t),v=Math.cos(t),y=Math.sin(i),c=Math.cos(i);switch(o){case"xyz":h[0]=n*v*c+s*a*y,h[1]=s*a*c-n*v*y,h[2]=s*v*y+n*a*c,h[3]=s*v*c-n*a*y;break;case"xzy":h[0]=n*v*c-s*a*y,h[1]=s*a*c-n*v*y,h[2]=s*v*y+n*a*c,h[3]=s*v*c+n*a*y;break;case"yxz":h[0]=n*v*c+s*a*y,h[1]=s*a*c-n*v*y,h[2]=s*v*y-n*a*c,h[3]=s*v*c+n*a*y;break;case"yzx":h[0]=n*v*c+s*a*y,h[1]=s*a*c+n*v*y,h[2]=s*v*y-n*a*c,h[3]=s*v*c-n*a*y;break;case"zxy":h[0]=n*v*c-s*a*y,h[1]=s*a*c+n*v*y,h[2]=s*v*y+n*a*c,h[3]=s*v*c-n*a*y;break;case"zyx":h[0]=n*v*c-s*a*y,h[1]=s*a*c+n*v*y,h[2]=s*v*y-n*a*c,h[3]=s*v*c+n*a*y;break;default:throw new Error(`Unknown rotation order: ${o}`)}return h}function U(r,d){const e=d??new u(4);return e[0]=r[0],e[1]=r[1],e[2]=r[2],e[3]=r[3],e}const J=U;function C(r,d,e){const o=e??new u(4);return o[0]=r[0]+d[0],o[1]=r[1]+d[1],o[2]=r[2]+d[2],o[3]=r[3]+d[3],o}function Y(r,d,e){const o=e??new u(4);return o[0]=r[0]-d[0],o[1]=r[1]-d[1],o[2]=r[2]-d[2],o[3]=r[3]-d[3],o}const $=Y;function K(r,d,e){const o=e??new u(4);return o[0]=r[0]*d,o[1]=r[1]*d,o[2]=r[2]*d,o[3]=r[3]*d,o}const nt=K;function ct(r,d,e){const o=e??new u(4);return o[0]=r[0]/d,o[1]=r[1]/d,o[2]=r[2]/d,o[3]=r[3]/d,o}function ft(r,d){return r[0]*d[0]+r[1]*d[1]+r[2]*d[2]+r[3]*d[3]}function Ft(r,d,e,o){const f=o??new u(4);return f[0]=r[0]+e*(d[0]-r[0]),f[1]=r[1]+e*(d[1]-r[1]),f[2]=r[2]+e*(d[2]-r[2]),f[3]=r[3]+e*(d[3]-r[3]),f}function W(r){const d=r[0],e=r[1],o=r[2],f=r[3];return Math.sqrt(d*d+e*e+o*o+f*f)}const tt=W;function R(r){const d=r[0],e=r[1],o=r[2],f=r[3];return d*d+e*e+o*o+f*f}const Gt=R;function mt(r,d){const e=d??new u(4),o=r[0],f=r[1],h=r[2],m=r[3],t=Math.sqrt(o*o+f*f+h*h+m*m);return t>1e-5?(e[0]=o/t,e[1]=f/t,e[2]=h/t,e[3]=m/t):(e[0]=0,e[1]=0,e[2]=0,e[3]=1),e}function It(r,d){return Math.abs(r[0]-d[0])<k&&Math.abs(r[1]-d[1])<k&&Math.abs(r[2]-d[2])<k&&Math.abs(r[3]-d[3])<k}function yt(r,d){return r[0]===d[0]&&r[1]===d[1]&&r[2]===d[2]&&r[3]===d[3]}function Vt(r){const d=r??new u(4);return d[0]=0,d[1]=0,d[2]=0,d[3]=1,d}const et=x.create(),Et=x.create(),Tt=x.create();function Xt(r,d,e){const o=e??new u(4),f=x.dot(r,d);return f<-.999999?(x.cross(Et,r,et),x.len(et)<1e-6&&x.cross(Tt,r,et),x.normalize(et,et),S(et,Math.PI,o),o):f>.999999?(o[0]=0,o[1]=0,o[2]=0,o[3]=1,o):(x.cross(r,d,et),o[0]=et[0],o[1]=et[1],o[2]=et[2],o[3]=1+f,mt(o,o))}const St=new u(4),Lt=new u(4);function At(r,d,e,o,f,h){const m=h??new u(4);return Q(r,o,f,St),Q(d,e,f,Lt),Q(St,Lt,2*f*(1-f),m),m}return{create:b,fromValues:P,set:z,fromAxisAngle:S,toAxisAngle:L,angle:X,multiply:O,mul:G,rotateX:T,rotateY:I,rotateZ:Z,slerp:Q,inverse:st,conjugate:_,fromMat:E,fromEuler:N,copy:U,clone:J,add:C,subtract:Y,sub:$,mulScalar:K,scale:nt,divScalar:ct,dot:ft,lerp:Ft,length:W,len:tt,lengthSq:R,lenSq:Gt,normalize:mt,equalsApproximately:It,equals:yt,identity:Vt,rotationTo:Xt,sqlerp:At}}const Fn=new Map;function ie(u){let x=Fn.get(u);return x||(x=oe(u),Fn.set(u,x)),x}function ce(u){function x(e,o,f,h){const m=new u(4);return e!==void 0&&(m[0]=e,o!==void 0&&(m[1]=o,f!==void 0&&(m[2]=f,h!==void 0&&(m[3]=h)))),m}const b=x;function P(e,o,f,h,m){const t=m??new u(4);return t[0]=e,t[1]=o,t[2]=f,t[3]=h,t}function z(e,o){const f=o??new u(4);return f[0]=Math.ceil(e[0]),f[1]=Math.ceil(e[1]),f[2]=Math.ceil(e[2]),f[3]=Math.ceil(e[3]),f}function S(e,o){const f=o??new u(4);return f[0]=Math.floor(e[0]),f[1]=Math.floor(e[1]),f[2]=Math.floor(e[2]),f[3]=Math.floor(e[3]),f}function L(e,o){const f=o??new u(4);return f[0]=Math.round(e[0]),f[1]=Math.round(e[1]),f[2]=Math.round(e[2]),f[3]=Math.round(e[3]),f}function X(e,o=0,f=1,h){const m=h??new u(4);return m[0]=Math.min(f,Math.max(o,e[0])),m[1]=Math.min(f,Math.max(o,e[1])),m[2]=Math.min(f,Math.max(o,e[2])),m[3]=Math.min(f,Math.max(o,e[3])),m}function O(e,o,f){const h=f??new u(4);return h[0]=e[0]+o[0],h[1]=e[1]+o[1],h[2]=e[2]+o[2],h[3]=e[3]+o[3],h}function G(e,o,f,h){const m=h??new u(4);return m[0]=e[0]+o[0]*f,m[1]=e[1]+o[1]*f,m[2]=e[2]+o[2]*f,m[3]=e[3]+o[3]*f,m}function T(e,o,f){const h=f??new u(4);return h[0]=e[0]-o[0],h[1]=e[1]-o[1],h[2]=e[2]-o[2],h[3]=e[3]-o[3],h}const I=T;function Z(e,o){return Math.abs(e[0]-o[0])<k&&Math.abs(e[1]-o[1])<k&&Math.abs(e[2]-o[2])<k&&Math.abs(e[3]-o[3])<k}function Q(e,o){return e[0]===o[0]&&e[1]===o[1]&&e[2]===o[2]&&e[3]===o[3]}function st(e,o,f,h){const m=h??new u(4);return m[0]=e[0]+f*(o[0]-e[0]),m[1]=e[1]+f*(o[1]-e[1]),m[2]=e[2]+f*(o[2]-e[2]),m[3]=e[3]+f*(o[3]-e[3]),m}function _(e,o,f,h){const m=h??new u(4);return m[0]=e[0]+f[0]*(o[0]-e[0]),m[1]=e[1]+f[1]*(o[1]-e[1]),m[2]=e[2]+f[2]*(o[2]-e[2]),m[3]=e[3]+f[3]*(o[3]-e[3]),m}function E(e,o,f){const h=f??new u(4);return h[0]=Math.max(e[0],o[0]),h[1]=Math.max(e[1],o[1]),h[2]=Math.max(e[2],o[2]),h[3]=Math.max(e[3],o[3]),h}function N(e,o,f){const h=f??new u(4);return h[0]=Math.min(e[0],o[0]),h[1]=Math.min(e[1],o[1]),h[2]=Math.min(e[2],o[2]),h[3]=Math.min(e[3],o[3]),h}function U(e,o,f){const h=f??new u(4);return h[0]=e[0]*o,h[1]=e[1]*o,h[2]=e[2]*o,h[3]=e[3]*o,h}const J=U;function C(e,o,f){const h=f??new u(4);return h[0]=e[0]/o,h[1]=e[1]/o,h[2]=e[2]/o,h[3]=e[3]/o,h}function Y(e,o){const f=o??new u(4);return f[0]=1/e[0],f[1]=1/e[1],f[2]=1/e[2],f[3]=1/e[3],f}const $=Y;function K(e,o){return e[0]*o[0]+e[1]*o[1]+e[2]*o[2]+e[3]*o[3]}function nt(e){const o=e[0],f=e[1],h=e[2],m=e[3];return Math.sqrt(o*o+f*f+h*h+m*m)}const ct=nt;function ft(e){const o=e[0],f=e[1],h=e[2],m=e[3];return o*o+f*f+h*h+m*m}const Ft=ft;function W(e,o){const f=e[0]-o[0],h=e[1]-o[1],m=e[2]-o[2],t=e[3]-o[3];return Math.sqrt(f*f+h*h+m*m+t*t)}const tt=W;function R(e,o){const f=e[0]-o[0],h=e[1]-o[1],m=e[2]-o[2],t=e[3]-o[3];return f*f+h*h+m*m+t*t}const Gt=R;function mt(e,o){const f=o??new u(4),h=e[0],m=e[1],t=e[2],i=e[3],n=Math.sqrt(h*h+m*m+t*t+i*i);return n>1e-5?(f[0]=h/n,f[1]=m/n,f[2]=t/n,f[3]=i/n):(f[0]=0,f[1]=0,f[2]=0,f[3]=0),f}function It(e,o){const f=o??new u(4);return f[0]=-e[0],f[1]=-e[1],f[2]=-e[2],f[3]=-e[3],f}function yt(e,o){const f=o??new u(4);return f[0]=e[0],f[1]=e[1],f[2]=e[2],f[3]=e[3],f}const Vt=yt;function et(e,o,f){const h=f??new u(4);return h[0]=e[0]*o[0],h[1]=e[1]*o[1],h[2]=e[2]*o[2],h[3]=e[3]*o[3],h}const Et=et;function Tt(e,o,f){const h=f??new u(4);return h[0]=e[0]/o[0],h[1]=e[1]/o[1],h[2]=e[2]/o[2],h[3]=e[3]/o[3],h}const Xt=Tt;function St(e){const o=e??new u(4);return o[0]=0,o[1]=0,o[2]=0,o[3]=0,o}function Lt(e,o,f){const h=f??new u(4),m=e[0],t=e[1],i=e[2],n=e[3];return h[0]=o[0]*m+o[4]*t+o[8]*i+o[12]*n,h[1]=o[1]*m+o[5]*t+o[9]*i+o[13]*n,h[2]=o[2]*m+o[6]*t+o[10]*i+o[14]*n,h[3]=o[3]*m+o[7]*t+o[11]*i+o[15]*n,h}function At(e,o,f){const h=f??new u(4);return mt(e,h),U(h,o,h)}function r(e,o,f){const h=f??new u(4);return nt(e)>o?At(e,o,h):yt(e,h)}function d(e,o,f){const h=f??new u(4);return st(e,o,.5,h)}return{create:x,fromValues:b,set:P,ceil:z,floor:S,round:L,clamp:X,add:O,addScaled:G,subtract:T,sub:I,equalsApproximately:Z,equals:Q,lerp:st,lerpV:_,max:E,min:N,mulScalar:U,scale:J,divScalar:C,inverse:Y,invert:$,dot:K,length:nt,len:ct,lengthSq:ft,lenSq:Ft,distance:W,dist:tt,distanceSq:R,distSq:Gt,normalize:mt,negate:It,copy:yt,clone:Vt,multiply:et,mul:Et,divide:Tt,div:Xt,zero:St,transformMat4:Lt,setLength:At,truncate:r,midpoint:d}}const Ln=new Map;function ae(u){let x=Ln.get(u);return x||(x=ce(u),Ln.set(u,x)),x}function Mn(u,x,b,P,z,S){return{mat3:ee(u),mat4:re(x),quat:ie(b),vec2:Gn(P),vec3:pn(z),vec4:ae(S)}}const{mat3:Me,mat4:on,quat:De,vec2:ze,vec3:be,vec4:Pe}=Mn(Float32Array,Float32Array,Float32Array,Float32Array,Float32Array,Float32Array);Mn(Float64Array,Float64Array,Float64Array,Float64Array,Float64Array,Float64Array);Mn(Kn,Array,Array,Array,Array,Array);var le=`struct Camera { texel:vec2f, diameter:f32, pad:f32, invProjection:mat4x4f, projection:mat4x4f, view:mat4x4f, invView:mat4x4f }
@group(0) @binding(0) var<uniform> camera:Camera;
@group(0) @binding(1) var garden:texture_2d<f32>;
@group(0) @binding(2) var textureSampler:sampler;
struct Full { @builtin(position) position:vec4f, @location(0) uv:vec2f }
struct Output { @location(0) color:vec4f, @location(1) depth:f32, @builtin(frag_depth) z:f32 }
@vertex fn vs(@builtin(vertex_index) id:u32)->Full {
  let p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));
  return Full(vec4f(p[id],0,1),vec2f(p[id].x*.5+.5,.5-p[id].y*.5));
}
fn hash(p:vec3f)->f32{return fract(sin(dot(p,vec3f(127.1,311.7,74.7)))*43758.5453);}
fn noise(p:vec3f)->f32{
  let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);
  let a=mix(mix(hash(i),hash(i+vec3f(1,0,0)),u.x),mix(hash(i+vec3f(0,1,0)),hash(i+vec3f(1,1,0)),u.x),u.y);
  let c=mix(mix(hash(i+vec3f(0,0,1)),hash(i+vec3f(1,0,1)),u.x),mix(hash(i+vec3f(0,1,1)),hash(i+vec3f(1,1,1)),u.x),u.y);
  return mix(a,c,u.z);
}
fn environment(d:vec3f)->vec3f {
  let uv=vec2f(atan2(d.z,d.x)/6.283185+.5,clamp(.5-d.y*.45,.03,.97));
  let photo=textureSampleLevel(garden,textureSampler,uv,0).rgb;
  return mix(photo,vec3f(.8,.89,.87),smoothstep(.4,.95,d.y)*.75);
}
@fragment fn fs(input:Full)->Output {
  let eye=camera.invView[3].xyz;
  let v=camera.invProjection*vec4f(input.uv.x*2-1,1-input.uv.y*2,1,1);
  let ray=normalize((camera.invView*vec4f(v.xyz/v.w,0)).xyz);
  var t=1e5;var n=vec3f(0,1,0);var kind=0.;
  
  let q=eye.xz-vec2f(24,18);let a=dot(ray.xz,ray.xz);let b=dot(q,ray.xz);
  for(var side=0;side<2;side++){
    let r=select(15.2,13.9,side==1);let discriminant=b*b-a*(dot(q,q)-r*r);
    if(discriminant>0. && a>.00001){
      for(var root=0;root<2;root++){
        let hit=(-b+select(-1.,1.,root==1)*sqrt(discriminant))/a;
        let p=eye+ray*hit;
        if(hit>.01 && hit<t && p.y>2. && p.y<13.){t=hit;n=vec3f(normalize(p.xz-vec2f(24,18)).x,0,normalize(p.xz-vec2f(24,18)).y)*select(1.,-1.,side==1);kind=1.;}
      }
    }
  }
  if(abs(ray.y)>.00001){
    for(var plane=0;plane<3;plane++){
      let y=select(select(13.,3.,plane==1),1.8,plane==2);
      let hit=(y-eye.y)/ray.y;let p=eye+ray*hit;let r=length(p.xz-vec2f(24,18));
      let valid=select(select(r>=13.9 && r<=15.2,r<13.9,plane==1),true,plane==2);
      if(hit>.01 && hit<t && valid){t=hit;n=vec3f(0,1,0);kind=select(1.,2.,plane==2);}
    }
  }
  var color=environment(ray);var depth=1e6;var z=.999999;
  if(t<1e4){
    let p=eye+ray*t;let grain=noise(p*7.);let patches=noise(p*.6);
    let stone=mix(vec3f(.055,.066,.057),vec3f(.21,.24,.20),patches*.5+grain*.5);
    let moss=mix(vec3f(.065,.12,.032),vec3f(.21,.27,.075),noise(p*1.6));
    var base=select(stone,mix(stone,moss,smoothstep(.2,.8,noise(p*.12))),kind>1.5);
    let light=normalize(vec3f(-.4,.85,.45));let diffuse=max(0.,dot(n,light));
    let ao=select(1.,.63,p.y<4. && length(p.xz-vec2f(24,18))<14.);
    let contact=select(1.,mix(.32,1.,smoothstep(15.,23.,length(p.xz-vec2f(24,18)))),kind>1.5);
    color=base*(.5+.9*diffuse)*ao*contact;
    let fog=1.-exp(-max(0.,t-110.)*.006);
    color=mix(color,environment(ray),fog);
    let view=camera.view*vec4f(p,1);let clip=camera.projection*view;depth=-view.z;z=min(.999999,clip.z/clip.w);
  }
  return Output(vec4f(color,1),depth,z);
}`,ue=`struct Camera { texel:vec2f, diameter:f32, pad:f32, invProjection:mat4x4f, projection:mat4x4f, view:mat4x4f, invView:mat4x4f }
@group(0) @binding(0) var<uniform> camera:Camera;
@group(0) @binding(1) var<uniform> b:Bamboo;
@group(0) @binding(2) var garden:texture_2d<f32>;
@group(0) @binding(3) var textureSampler:sampler;
struct Input { @location(0) p:vec3f, @location(1) n:vec3f, @location(2) material:f32 }
struct Vertex { @builtin(position) clip:vec4f, @location(0) local:vec3f, @location(1) normal:vec3f, @location(2) world:vec3f, @location(3) @interpolate(flat) material:f32, @location(4) depth:f32 }
struct Output { @location(0) color:vec4f, @location(1) depth:f32 }
@vertex fn vs(input:Input)->Vertex {
  let fixed=input.material>=10.;
  let p=select(worldPoint(input.p,b),input.p,fixed);let v=camera.view*vec4f(p,1);
  return Vertex(camera.projection*v,input.p,select(worldVector(input.n,b),input.n,fixed),p,input.material,-v.z);
}
fn hash(p:vec2f)->f32{return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453);}
fn grain(p:vec2f)->f32{
  let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2f(1,0)),u.x),mix(hash(i+vec2f(0,1)),hash(i+vec2f(1,1)),u.x),u.y);
}
@fragment fn fs(v:Vertex)->Output {
  let material=v.material%10.;
  let theta=atan2(v.local.z,v.local.y);let uv=vec2f(v.local.x,theta);
  let fibers=grain(uv*vec2f(.24,120));let mottled=grain(uv*vec2f(1.5,12));let fine=grain(uv*vec2f(22,310));
  var base=mix(vec3f(.065,.12,.022),vec3f(.28,.36,.075),fibers*.55+mottled*.45);
  let node=exp(-pow((v.local.x-19.)/.20,2.));
  base=mix(base,vec3f(.33,.38,.17),node*.7);
  var rough=.32;
  if(material>.5){base=mix(vec3f(.25,.15,.055),vec3f(.56,.42,.22),fibers*.6+fine*.4);rough=.46;}
  if(material>1.5){base=mix(vec3f(.50,.33,.14),vec3f(.82,.69,.44),fine);rough=.68;}
  if(v.material>=30.){base=mix(vec3f(.11,.12,.10),vec3f(.29,.31,.27),fine);rough=.9;}
  let eye=camera.invView[3].xyz;let view=normalize(eye-v.world);
  let light=normalize(vec3f(-.4,.85,.45));
  var n=normalize(v.normal);if(dot(n,view)<0.){n=-n;}
  let tangent=normalize(cross(n,worldVector(vec3f(1,0,0),b))+vec3f(.00001));
  n=normalize(n+tangent*(fibers-.5)*.13);
  let diffuse=max(0.,dot(n,light));let h=normalize(light+view);
  let spec=pow(max(0.,dot(n,h)),mix(160.,28.,rough));
  let interior=select(1.,.56+.28*clamp((4.-v.local.x)/8.,0.,1.),material>.5 && material<1.5);
  let rimLight=.12*pow(1.-max(0.,dot(n,view)),3.);
  let reflection=reflect(-view,n);let env=textureSampleLevel(garden,textureSampler,vec2f(atan2(reflection.z,reflection.x)/6.283+.5,.5-reflection.y*.45),0).rgb;
  let color=base*(.48+.85*diffuse)*interior+spec*vec3f(.65,.72,.49)+env*rimLight;
  return Output(vec4f(color,1),v.depth);
}`,fe=`struct Camera { texel:vec2f, diameter:f32, pad:f32, invProjection:mat4x4f, projection:mat4x4f, view:mat4x4f, invView:mat4x4f }
@group(0) @binding(0) var<uniform> camera:Camera;
@group(0) @binding(1) var depthMap:texture_2d<f32>;
@group(0) @binding(2) var thicknessMap:texture_2d<f32>;
@group(0) @binding(3) var scene:texture_2d<f32>;
@group(0) @binding(4) var sceneDepth:texture_2d<f32>;
@group(0) @binding(5) var garden:texture_2d<f32>;
@group(0) @binding(6) var textureSampler:sampler;
struct Full { @builtin(position) position:vec4f, @location(0) uv:vec2f }
@vertex fn vs(@builtin(vertex_index) id:u32)->Full {
  let p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));return Full(vec4f(p[id],0,1),vec2f(p[id].x*.5+.5,.5-p[id].y*.5));
}
fn eyePosition(uv:vec2f,d:f32)->vec3f {
  let n=vec4f(uv.x*2-1,1-uv.y*2,-camera.projection[2].z+camera.projection[3].z/d,1);
  let p=camera.invProjection*n;return p.xyz/p.w;
}
fn at(pixel:vec2i)->vec3f {
  let p=clamp(pixel,vec2i(0),vec2i(textureDimensions(depthMap))-1);
  return eyePosition((vec2f(p)+.5)*camera.texel,abs(textureLoad(depthMap,p,0).r));
}
fn env(d:vec3f)->vec3f {
  let photo=textureSampleLevel(garden,textureSampler,vec2f(atan2(d.z,d.x)/6.283185+.5,clamp(.5-d.y*.45,.01,.99)),0).rgb;
  return mix(photo,vec3f(.87,.95,.96),smoothstep(-.2,.65,d.y)*.85);
}
@fragment fn fs(input:Full)->@location(0) vec4f {
  let pixel=vec2i(input.position.xy);let depth=abs(textureLoad(depthMap,pixel,0).r);
  let background=textureLoad(scene,pixel,0).rgb;
  if(depth>=1e4 || depth>textureLoad(sceneDepth,pixel,0).r+.025){return vec4f(background,1);}
  let p=eyePosition(input.uv,depth);
  let dx1=at(pixel+vec2i(1,0))-p;let dx2=p-at(pixel-vec2i(1,0));
  let dy1=at(pixel+vec2i(0,1))-p;let dy2=p-at(pixel-vec2i(0,1));
  let dx=select(dx1,dx2,abs(dx1.z)>abs(dx2.z));let dy=select(dy1,dy2,abs(dy1.z)>abs(dy2.z));
  var n=normalize(-cross(dx,dy)+vec3f(.0000001));let ray=normalize(p);if(dot(n,ray)>0.){n=-n;}
  let world=(camera.invView*vec4f(p,1)).xyz;
  let reflection=normalize((camera.invView*vec4f(reflect(ray,n),0)).xyz);
  let thickness=max(.03,textureSampleLevel(thicknessMap,textureSampler,input.uv,0).r);
  let uv=clamp(input.uv+n.xy*vec2f(1,-1)*min(.026,thickness*.012),vec2f(.002),vec2f(.998));
  var transmission=textureSampleLevel(scene,textureSampler,uv,0).rgb;
  let tinted=exp(-vec3f(.13,.055,.025)*thickness);
  transmission=transmission*tinted;
  let fresnel=.0204+.9796*pow(1.-max(0.,dot(n,-ray)),5.);
  let light=normalize((camera.view*vec4f(-.4,.85,.45,0)).xyz);
  let highlight=pow(max(0.,dot(n,normalize(light-ray))),120.);
  var color=mix(transmission,env(reflection),clamp(fresnel,.025,.82))+highlight*vec3f(1,.98,.87)*.55;
  
  color=mix(color,vec3f(.16,.29,.23),min(.10,thickness*.025));
  return vec4f(color,1);
}`,de=`override supportScale:f32;
override falloff:f32;
override layerBand:f32;
override cutoff:f32;
override fringeTag:f32;
struct Camera { texel:vec2f, diameter:f32, pad:f32, invProjection:mat4x4f, projection:mat4x4f, view:mat4x4f, invView:mat4x4f }
struct Particle { position:vec3f, velocity:vec3f }
@group(0) @binding(0) var<storage,read> particles:array<Particle>;
@group(0) @binding(1) var<uniform> camera:Camera;
@group(0) @binding(2) var nearest:texture_2d<f32>;
struct Vertex { @builtin(position) position:vec4f, @location(0) uv:vec2f, @location(1) center:vec3f, @location(2) axis:vec2f, @location(3) radii:vec2f }
@vertex fn vs(@builtin(vertex_index) i:u32,@builtin(instance_index) instance:u32)->Vertex {
  let corners=array<vec2f,6>(vec2f(1,1),vec2f(1,-1),vec2f(-1,-1),vec2f(1,1),vec2f(-1,-1),vec2f(-1,1));
  let particle=particles[instance];let center=(camera.view*vec4f(particle.position,1)).xyz;
  let velocity=(camera.view*vec4f(particle.velocity,0)).xyz;
  let speed=length(velocity.xy);var axis=vec2f(0,1);if(speed>.001){axis=velocity.xy/speed;}
  let airborne=select(0.,1.,particle.position.y>14.);
  let stretch=1.+min(2.6,speed*1.1)*airborne;
  
  let radii=camera.diameter*.5*supportScale*vec2f(stretch,1.);
  let side=vec2f(-axis.y,axis.x);let corner=corners[i];
  let offset=axis*corner.x*radii.x+side*corner.y*radii.y;
  return Vertex(camera.projection*vec4f(center+vec3f(offset,0),1),corner,center,axis,radii);
}
struct Depth { @location(0) depth:f32, @builtin(frag_depth) z:f32 }
@fragment fn depth(v:Vertex)->Depth {
  let r=dot(v.uv,v.uv);if(r>1.){discard;}
  let side=vec2f(-v.axis.y,v.axis.x);
  let offset=v.axis*v.uv.x*v.radii.x+side*v.uv.y*v.radii.y;
  let p=v.center+vec3f(offset,sqrt(1.-r)*v.radii.y);
  let clip=camera.projection*vec4f(p,1);
  
  
  let fringe=exp(-falloff*r)-exp(-falloff)<cutoff;
  return Depth(-p.z+select(0.,fringeTag,fringe),clip.z/clip.w*.5+select(0.,.5,fringe));
}
@fragment fn moments(v:Vertex)->@location(0) vec4f {
  let r=dot(v.uv,v.uv);if(r>1.){discard;}
  let encoded=textureLoad(nearest,vec2i(v.position.xy),0).r;
  let near=encoded-select(0.,fringeTag,encoded>=fringeTag);
  let delta=-v.center.z-near;let sigma=v.radii.y*.4082483;
  if(abs(delta)>max(layerBand,sigma*6.)){discard;}
  let w=exp(-falloff*r)-exp(-falloff);
  return w*vec4f(1,delta,delta*delta,sigma);
}`,he=`@group(0) @binding(0) var moments:texture_2d<f32>;
@group(0) @binding(1) var nearest:texture_2d<f32>;
override cutoff:f32;
override fringeTag:f32;
struct Full { @builtin(position) position:vec4f }
struct Surface { @location(0) depth:f32, @location(1) thickness:f32 }
@vertex fn vs(@builtin(vertex_index) id:u32)->Full {
  let p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));return Full(vec4f(p[id],0,1));
}
@fragment fn fs(input:Full)->Surface {
  let pixel=vec2i(input.position.xy);let m=textureLoad(moments,pixel,0);
  if(m.x<cutoff){return Surface(1e6,0);}
  
  let encoded=textureLoad(nearest,pixel,0).r;
  let near=encoded-select(0.,fringeTag,encoded>=fringeTag);
  let mean=m.y/m.x;let sigma=max(.08,m.w/m.x);
  let variance=max(0.,m.z/m.x-mean*mean);
  let offset=min(sigma*2.5,sqrt(variance+sigma*sigma)*sqrt(2.*log(m.x/cutoff)));
  return Surface(near+mean-offset,min(8.,.1*m.x*sigma*2.5066));
}`;(()=>{function S(T){return T>=1?0:Math.exp(-3*T)-Math.exp(-3)}function L(T,I){return T+(S(I)<.4?1024:0)}function X(T){return T>=1024?T-1024:T}function O(T,I){return Math.abs(T)>Math.max(2.5,I*6)?0:1}function G(T,I){if(T[0]<.4)return null;const Z=T[1]/T[0],Q=Math.max(.08,T[3]/T[0]),st=Math.max(0,T[2]/T[0]-Z*Z),_=Math.min(Q*2.5,Math.sqrt(st+Q*Q)*Math.sqrt(2*Math.log(T[0]/.4)));return{depth:I+Z-_,thickness:Math.min(8,.1*T[0]*Q*2.5066)}}globalThis.FluidSurface={cutoff:.4,falloff:3,layerBand:2.5,supportScale:2.1,fringeTag:1024,kernel:S,anchor:L,decodeAnchor:X,layerWeight:O,resolve:G}})();var pe=`@group(0) @binding(1) var depthTexture: texture_2d<f32>;\r
@group(0) @binding(2) var<uniform> uniforms: FilterUniforms;

struct FragmentInput {\r
    @location(0) uv: vec2f,  \r
    @location(1) iuv: vec2f\r
}

override projectedParticleConstant: f32; \r
override maxFilterSize: f32;\r
override blur2D: u32;

struct FilterUniforms {\r
    blurDir: vec2f,\r
}

@fragment\r
fn fs(input: FragmentInput) -> @location(0) vec4f {\r
    let depth: f32 = abs(textureLoad(depthTexture, vec2u(input.iuv), 0).r);

    if (depth >= 1e4) {\r
        return vec4f(vec3f(depth), 1.);\r
    }

    let filterSize: i32 = min(i32(maxFilterSize), i32(ceil(projectedParticleConstant / depth)));

    let sigma: f32 = f32(filterSize) / 2.0; \r
    let sigmaSquareInv: f32 = 1.0 / (2.0 * sigma * sigma);

    let mu = 3. * 0.6; 
    let depthThreshold = 10.0 * 0.6;

    let higherDepthBound = depth + mu;

    var sum: f32 = depth;\r
    var wsum: f32 = 1.0;\r
    
    if (blur2D == 0) {\r
        var sum2 = vec2f(0, 0);\r
        var wsum2 = vec2f(0, 0);\r
        var depthThresholdLowX = depth - depthThreshold;\r
        var depthThresholdHighX = depth + depthThreshold;\r
        var depthThresholdLowY = depth - depthThreshold;\r
        var depthThresholdHighY = depth + depthThreshold;\r
        for (var r: i32 = 1; r <= filterSize; r++) {\r
            var gaussianWeight: f32 = exp(-f32(r * r) * sigmaSquareInv);\r
            var sampledDepthX: f32 = abs(textureLoad(depthTexture, vec2u(input.iuv - vec2f(f32(r)) * uniforms.blurDir), 0).r);\r
            var sampledDepthY: f32 = abs(textureLoad(depthTexture, vec2u(input.iuv + vec2f(f32(r)) * uniforms.blurDir), 0).r);

            var w = vec2f(gaussianWeight);

            if (sampledDepthX < depthThresholdLowX) {\r
                w.x = 0.;\r
                w.y = 0.; \r
            } else {\r
                if (sampledDepthX > depthThresholdHighX) {\r
                    sampledDepthX = higherDepthBound;\r
                } else {\r
                    depthThresholdLowX = min(depthThresholdLowX, sampledDepthX - depthThreshold);\r
                    depthThresholdHighX = max(depthThresholdHighX, sampledDepthX + depthThreshold);\r
                }\r
            }

            if (sampledDepthY < depthThresholdLowY) {\r
                w.x = 0.;\r
                w.y = 0.; \r
            } else {\r
                if (sampledDepthY > depthThresholdHighY) {\r
                    sampledDepthY = higherDepthBound;\r
                } else {\r
                    depthThresholdLowY = min(depthThresholdLowY, sampledDepthY - depthThreshold);\r
                    depthThresholdHighY = max(depthThresholdHighY, sampledDepthY + depthThreshold);\r
                }\r
            }

            sum2 += vec2f(sampledDepthX, sampledDepthY) * w;\r
            wsum2 += w;\r
        }\r
        sum += sum2.x + sum2.y;\r
        wsum += wsum2.x + wsum2.y;\r
    } else {\r
        let filterSize2D = 2;\r
        var depthThresholdLow = depth - depthThreshold;\r
        var depthThresholdHigh = depth + depthThreshold;\r
        var sum4 = vec4f(0.);\r
        var wsum4 = vec4f(0.);\r
        for (var r: i32 = 1; r <= filterSize2D; r++) {\r
            for (var i: i32 = 0; i < 2 * r; i++) {\r
                let gaussianWeight = exp((-f32(r*r) + f32((r-i) * (r-i))) * sigmaSquareInv);

                var sampledDepthX: f32 = abs(textureLoad(depthTexture, vec2u(input.iuv - vec2f(f32(r), f32(r-i))), 0).r);\r
                var sampledDepthY: f32 = abs(textureLoad(depthTexture, vec2u(input.iuv + vec2f(f32(r), f32(r-i))), 0).r);\r
                var sampledDepthZ: f32 = abs(textureLoad(depthTexture, vec2u(input.iuv - vec2f(f32(r-i), f32(r))), 0).r);\r
                var sampledDepthW: f32 = abs(textureLoad(depthTexture, vec2u(input.iuv + vec2f(f32(r-i), f32(r))), 0).r);

                var w = vec4f(gaussianWeight);

                if (sampledDepthX < depthThresholdLow) {\r
                    w.x = 0.;\r
                    w.y = 0.; 
                } else {\r
                    if (sampledDepthX > depthThresholdHigh) {\r
                        sampledDepthX = higherDepthBound;\r
                    } else {\r
                        depthThresholdLow = min(depthThresholdLow, sampledDepthX - depthThreshold);\r
                        depthThresholdHigh = max(depthThresholdHigh, sampledDepthX + depthThreshold);\r
                    }\r
                }

                if (sampledDepthY < depthThresholdLow) {\r
                    w.x = 0.;\r
                    w.y = 0.; \r
                } else {\r
                    if (sampledDepthY > depthThresholdHigh) {\r
                        sampledDepthY = higherDepthBound;\r
                    } else {\r
                        depthThresholdLow = min(depthThresholdLow, sampledDepthY - depthThreshold);\r
                        depthThresholdHigh = max(depthThresholdHigh, sampledDepthY + depthThreshold);\r
                    }\r
                }

                if (sampledDepthZ < depthThresholdLow) {\r
                    w.z = 0.;\r
                    w.w = 0.; \r
                } else {\r
                    if (sampledDepthZ > depthThresholdHigh) {\r
                        sampledDepthZ = higherDepthBound;\r
                    } else {\r
                        depthThresholdLow = min(depthThresholdLow, sampledDepthZ - depthThreshold);\r
                        depthThresholdHigh = max(depthThresholdHigh, sampledDepthZ + depthThreshold);\r
                    }\r
                }

                if (sampledDepthW < depthThresholdLow) {\r
                    w.z = 0.;\r
                    w.w = 0.; \r
                } else {\r
                    if (sampledDepthW > depthThresholdHigh) {\r
                        sampledDepthW = higherDepthBound;\r
                    } else {\r
                        depthThresholdLow = min(depthThresholdLow, sampledDepthW - depthThreshold);\r
                        depthThresholdHigh = max(depthThresholdHigh, sampledDepthW + depthThreshold);\r
                    }\r
                }

                sum4 += vec4f(sampledDepthX, sampledDepthY, sampledDepthZ, sampledDepthW) * w;\r
                wsum4 += w;\r
            }\r
        }\r
        sum += sum4.x + sum4.y + sum4.z + sum4.w;\r
        wsum += wsum4.x + wsum4.y + wsum4.z + wsum4.w;\r
    }

    return vec4f(sum / wsum, 0., 0., 1.);\r
}`,ve=`struct VertexOutput {\r
  @builtin(position) position : vec4f,\r
  @location(0) uv : vec2f,\r
  @location(1) iuv : vec2f,\r
}

override screenWidth: f32;\r
override screenHeight: f32;

@vertex\r
fn vs(@builtin(vertex_index) vertex_index : u32) -> VertexOutput {\r
    var out: VertexOutput;

    var pos = array(\r
        vec2( 1.0,  1.0),\r
        vec2( 1.0, -1.0),\r
        vec2(-1.0, -1.0),\r
        vec2( 1.0,  1.0),\r
        vec2(-1.0, -1.0),\r
        vec2(-1.0,  1.0),\r
    );

    var uv = array(\r
        vec2(1.0, 0.0),\r
        vec2(1.0, 1.0),\r
        vec2(0.0, 1.0),\r
        vec2(1.0, 0.0),\r
        vec2(0.0, 1.0),\r
        vec2(0.0, 0.0),\r
    );

    out.position = vec4(pos[vertex_index], 0.0, 1.0);\r
    out.uv = uv[vertex_index];\r
    out.iuv = out.uv * vec2f(screenWidth, screenHeight);

    return out;\r
}`;class we{constructor(x,b,P,z,S,L,X){V(this,"uniform");V(this,"data",new Float32Array(68));V(this,"textures",[]);V(this,"buffers",[]);V(this,"background");V(this,"mesh");V(this,"water");V(this,"particles");V(this,"moments");V(this,"resolve");V(this,"filter");V(this,"bgGroup");V(this,"meshGroup");V(this,"waterGroup");V(this,"particleGroup");V(this,"momentsGroup");V(this,"resolveGroup");V(this,"filterGroups");V(this,"color");V(this,"worldDepth");V(this,"depthTest");V(this,"fluidDepth");V(this,"tempDepth");V(this,"fluidTest");V(this,"thicknessView");V(this,"momentsView");V(this,"vertex");V(this,"vertexCount");this.device=x,this.canvas=b;const O=(K,nt)=>{const ct=x.createBuffer({size:K,usage:nt|GPUBufferUsage.COPY_DST});return this.buffers.push(ct),ct};this.uniform=O(272,GPUBufferUsage.UNIFORM),this.vertex=O(X.byteLength,GPUBufferUsage.VERTEX),x.queue.writeBuffer(this.vertex,0,X),this.vertexCount=X.length/8;const G=K=>{const nt=x.createTexture({size:[b.width,b.height],format:K,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});return this.textures.push(nt),nt.createView()};this.color=G(P),this.worldDepth=G("r32float"),this.depthTest=G("depth32float"),this.fluidDepth=G("r32float"),this.tempDepth=G("r32float"),this.fluidTest=G("depth32float"),this.thicknessView=G("r16float"),this.momentsView=G("rgba16float");const T=(K,nt)=>x.createShaderModule({label:K,code:nt}),I=T("3D stone basin and garden",le),Z=T("Blender bamboo material",cn+ue),Q=T("Water refraction and scene-depth occlusion",fe),st=T("Splash ellipsoid surface",de),_=[{format:P},{format:"r32float"}],E={format:"depth32float",depthWriteEnabled:!0,depthCompare:"less"};this.background=x.createRenderPipeline({layout:"auto",vertex:{module:I},fragment:{module:I,targets:_},depthStencil:E}),this.mesh=x.createRenderPipeline({layout:"auto",vertex:{module:Z,buffers:[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"float32"}]}]},fragment:{module:Z,targets:_},depthStencil:E}),this.water=x.createRenderPipeline({layout:"auto",vertex:{module:Q},fragment:{module:Q,targets:[{format:P}]}});const N={supportScale:FluidSurface.supportScale};this.particles=x.createRenderPipeline({layout:"auto",vertex:{module:st,entryPoint:"vs",constants:N},fragment:{module:st,entryPoint:"depth",constants:{cutoff:FluidSurface.cutoff,falloff:FluidSurface.falloff,fringeTag:FluidSurface.fringeTag},targets:[{format:"r32float"}]},depthStencil:E}),this.moments=x.createRenderPipeline({layout:"auto",vertex:{module:st,entryPoint:"vs",constants:N},fragment:{module:st,entryPoint:"moments",constants:{falloff:FluidSurface.falloff,layerBand:FluidSurface.layerBand,fringeTag:FluidSurface.fringeTag},targets:[{format:"rgba16float",blend:{color:{srcFactor:"one",dstFactor:"one",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one",operation:"add"}}}]}});const U=T("Merged fluid density contour",he);this.resolve=x.createRenderPipeline({layout:"auto",vertex:{module:U},fragment:{module:U,constants:{cutoff:FluidSurface.cutoff,fringeTag:FluidSurface.fringeTag},targets:[{format:"r32float"},{format:"r16float"}]}}),this.filter=x.createRenderPipeline({layout:"auto",vertex:{module:T("Full screen",ve),constants:{screenWidth:b.width,screenHeight:b.height}},fragment:{module:T("Splash narrow-range surface filter",pe),constants:{maxFilterSize:8,projectedParticleConstant:b.height*.36,blur2D:0},targets:[{format:"r32float"}]}});const J=x.createSampler({magFilter:"linear",minFilter:"linear"}),C=L.createView(),Y=K=>({buffer:K}),$=(K,nt)=>x.createBindGroup({layout:K.getBindGroupLayout(0),entries:nt});this.bgGroup=$(this.background,[{binding:0,resource:Y(this.uniform)},{binding:1,resource:C},{binding:2,resource:J}]),this.meshGroup=$(this.mesh,[{binding:0,resource:Y(this.uniform)},{binding:1,resource:Y(S)},{binding:2,resource:C},{binding:3,resource:J}]),this.waterGroup=$(this.water,[{binding:0,resource:Y(this.uniform)},{binding:1,resource:this.fluidDepth},{binding:2,resource:this.thicknessView},{binding:3,resource:this.color},{binding:4,resource:this.worldDepth},{binding:5,resource:C},{binding:6,resource:J}]),this.particleGroup=$(this.particles,[{binding:0,resource:Y(z)},{binding:1,resource:Y(this.uniform)}]),this.momentsGroup=$(this.moments,[{binding:0,resource:Y(z)},{binding:1,resource:Y(this.uniform)},{binding:2,resource:this.tempDepth}]),this.resolveGroup=$(this.resolve,[{binding:0,resource:this.momentsView},{binding:1,resource:this.tempDepth}]),this.filterGroups=[[1,0],[0,1]].map((K,nt)=>{const ct=O(8,GPUBufferUsage.UNIFORM);return x.queue.writeBuffer(ct,0,new Float32Array(K)),$(this.filter,[{binding:1,resource:nt?this.tempDepth:this.fluidDepth},{binding:2,resource:Y(ct)}])})}camera(x,b){const P=this.canvas.clientWidth/this.canvas.clientHeight,z=[35,25,18],S=P<.85?96:82,L=[z[0]+Math.sin(x)*Math.cos(b)*S,z[1]+Math.sin(b)*S,z[2]+Math.cos(x)*Math.cos(b)*S],X=on.perspective(.7,P,.3,220),O=on.lookAt(L,z,[0,1,0]);this.data.set([1/this.canvas.width,1/this.canvas.height,1.05,0],0),this.data.set(on.inverse(X),4),this.data.set(X,20),this.data.set(O,36),this.data.set(on.inverse(O),52),this.device.queue.writeBuffer(this.uniform,0,this.data)}draw(x,b,P){const z=(I,Z=0)=>({view:I,clearValue:{r:Z,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}),S=I=>({view:I,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}),L=x.beginRenderPass({colorAttachments:[z(this.color),z(this.worldDepth,1e6)],depthStencilAttachment:S(this.depthTest)});L.setPipeline(this.background),L.setBindGroup(0,this.bgGroup),L.draw(3),L.setPipeline(this.mesh),L.setBindGroup(0,this.meshGroup),L.setVertexBuffer(0,this.vertex),L.draw(this.vertexCount),L.end();const X=x.beginRenderPass({colorAttachments:[z(this.tempDepth,1e6)],depthStencilAttachment:S(this.fluidTest)});X.setPipeline(this.particles),X.setBindGroup(0,this.particleGroup),X.draw(6,P),X.end();const O=x.beginRenderPass({colorAttachments:[{...z(this.momentsView),clearValue:{r:0,g:0,b:0,a:0}}]});O.setPipeline(this.moments),O.setBindGroup(0,this.momentsGroup),O.draw(6,P),O.end();const G=x.beginRenderPass({colorAttachments:[z(this.fluidDepth,1e6),z(this.thicknessView)]});G.setPipeline(this.resolve),G.setBindGroup(0,this.resolveGroup),G.draw(3),G.end();for(let I=0;I<4;I++)for(let Z=0;Z<2;Z++){const Q=x.beginRenderPass({colorAttachments:[z(Z?this.fluidDepth:this.tempDepth,1e6)]});Q.setPipeline(this.filter),Q.setBindGroup(0,this.filterGroups[Z]),Q.draw(6),Q.end()}const T=x.beginRenderPass({colorAttachments:[z(b)]});T.setPipeline(this.water),T.setBindGroup(0,this.waterGroup),T.draw(3),T.end()}destroy(){this.textures.forEach(x=>x.destroy()),this.buffers.forEach(x=>x.destroy())}}const ot=document.querySelector("#scene"),Dn=document.querySelector("#height"),Nt=document.querySelector("#interaction"),ln=document.querySelector("#pause"),In=document.querySelector("#reset"),Vn=document.querySelector("#status"),vn=document.querySelector("#message"),zn=[Dn,Nt,ln,In];zn.forEach(u=>u.disabled=!0);const Pt=new ShishiMechanism;let kt=!1,it,ut,Ot,$t,Ht,Wt=0,wn=!1,xn=!1,jt=matchMedia("(prefers-reduced-motion: reduce)").matches,un=-.82,Zt=.37,Yt=Pt.rest,Qt=0,Jt=0,gn=0,fn=0,dn=0,mn=0,Ut=null;const En=()=>{ln.textContent=jt?"Play":"Pause",ln.setAttribute("aria-pressed",String(jt))};En();function Xn(){Ot==null||Ot.destroy(),ut==null||ut.destroy(),Ht==null||Ht.destroy(),$t==null||$t.destroy(),it==null||it.destroy()}function hn(u){kt||(kt=!0,cancelAnimationFrame(Wt),Wt=0,vn.hidden=!1,vn.textContent="The 3D scene could not start. "+(u instanceof Error?u.message:String(u)),Vn.textContent="Unavailable",ot.dataset.state="error",zn.forEach(x=>x.disabled=!0),console.error(u),Xn())}function Rt(){xn=!0,!Wt&&!wn&&!kt&&!document.hidden&&(Wt=requestAnimationFrame(ge))}Dn.addEventListener("input",Rt);Nt.addEventListener("change",()=>{ot.classList.toggle("orbit",Nt.value!=="tilt"),Ut=null,Rt()});ln.addEventListener("click",()=>{jt=!jt,Jt=0,Qt=0,En(),Rt()});In.addEventListener("click",()=>{mn++,ut==null||ut.reset(),Pt.reset(),Yt=Pt.rest,fn=dn=Jt=0,gn=0,Rt()});ot.addEventListener("pointerdown",u=>{Ut={id:u.pointerId,x:u.clientX,y:u.clientY,start:Yt},ot.setPointerCapture(u.pointerId)});ot.addEventListener("pointermove",u=>{!Ut||u.pointerId!==Ut.id||(Nt.value==="tilt"?(Yt=Math.max(Pt.rest,Math.min(Pt.limit,Ut.start+(u.clientY-Ut.y)*.004)),Pt.angle=Yt,Pt.velocity=0):(un-=(u.clientX-Ut.x)*.006,Zt=Math.max(.1,Math.min(1.15,Zt+(u.clientY-Ut.y)*.005)),Ut.x=u.clientX,Ut.y=u.clientY),Rt())});for(const u of["pointerup","pointercancel","lostpointercapture"])ot.addEventListener(u,()=>{Ut=null});ot.addEventListener("keydown",u=>{["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Home"].includes(u.key)&&(u.preventDefault(),u.key==="Home"?(un=-.82,Zt=.37):u.key==="ArrowLeft"||u.key==="ArrowRight"?un+=u.key==="ArrowLeft"?-.08:.08:Nt.value==="tilt"?(Yt=Math.max(Pt.rest,Math.min(Pt.limit,Yt+(u.key==="ArrowUp"?-.04:.04))),Pt.angle=Yt,Pt.velocity=0):Zt=Math.max(.1,Math.min(1.15,Zt+(u.key==="ArrowUp"?.04:-.04))),Rt())});document.addEventListener("visibilitychange",()=>{document.hidden?(cancelAnimationFrame(Wt),Wt=0,Qt=0,Jt=0):Rt()});window.addEventListener("resize",()=>{Qt=0,Rt()});window.addEventListener("pagehide",()=>{kt=!0,cancelAnimationFrame(Wt),Xn()},{once:!0});let an,yn,Un;function kn(){const u=Math.min(devicePixelRatio||1,1.25,1e3/Math.max(ot.clientWidth,ot.clientHeight)),x=Math.max(2,Math.floor(ot.clientWidth*u/2)*2),b=Math.max(2,Math.floor(ot.clientHeight*u/2)*2);ot.width===x&&ot.height===b&&Ot||(Ot==null||Ot.destroy(),ot.width=x,ot.height=b,Ot=new we(it,ot,yn,ut.positions,ut.bamboo,$t,Un))}async function xe(){if(kt||!it||!ut||!Ht)return;const u=mn,x=Yt,b=it.createCommandEncoder();b.copyBufferToBuffer(ut.particles,0,Ht,0,Ht.size),it.queue.submit([b.finish()]),await Ht.mapAsync(GPUMapMode.READ);try{if(kt||u!==mn)return;const P=new Float32Array(Ht.getMappedRange());let z=0,S=0,L=0,X=0,O=0;for(let G=0;G<ut.count;G++){const T=[P[G*20],P[G*20+1],P[G*20+2]];if(!T.every(Number.isFinite)){X++;continue}const I=BambooGeometry.toLocal(T,x);I[0]>.85*I[1]&&I[0]<17.6&&Math.hypot(I[1],I[2])<4.12?(z++,O+=BambooGeometry.pivot[0]-T[0]):T[1]>14?S++:L++}if(fn=z,dn=O,ot.dataset.liquid=JSON.stringify({inside:z,falling:S,pool:L,invalid:X,total:ut.count}),X)throw new Error("The water simulation became unstable. Reload to reset it.")}finally{Ht.unmap()}}async function ge(u){if(Wt=0,!(kt||document.hidden||!it||!ut)){wn=!0,xn=!1;try{kn();const x=Qt?Math.min((u-Qt)/1e3,1/20):1/60;Qt=u,Jt+=jt?0:x*120;const b=Math.min(6,Math.floor(Jt));Jt-=b,Nt.value!=="tilt"&&(Yt=Pt.step(b/120,fn,dn)),ut.update(Yt,b,Number(Dn.value)*.0026),Ot.camera(un,Zt);const P=it.createCommandEncoder();if(ut.execute(P,b),Ot.draw(P,an.getCurrentTexture().createView(),ut.count),it.queue.submit([P.finish()]),await it.queue.onSubmittedWorkDone(),kt)return;vn.hidden=!0,ot.dataset.state="ready",zn.forEach(S=>S.disabled=!1),u-gn>100&&(gn=u,await xe());const z=Nt.value==="tilt"?"Manual":Pt.phase;Vn.textContent=jt?"Paused":`${z} · ${Pt.cycles} cycles`,ot.dataset.mechanism=JSON.stringify({angle:Yt,phase:z,cycles:Pt.cycles,waterCount:fn,waterMoment:dn})}catch(x){hn(x)}finally{wn=!1}(xn||!jt)&&Rt()}}async function me(){if(!navigator.gpu)throw new Error("WebGPU is required. Please use a compatible Chrome or Edge browser.");const u=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!u)throw new Error("No compatible graphics adapter is available.");if(it=await u.requestDevice(),kt){it.destroy();return}if(it.addEventListener("uncapturederror",z=>hn(new Error(z.error.message))),it.lost.then(z=>{kt||hn(new Error("Graphics device disconnected: "+z.message))}),an=ot.getContext("webgpu"),!an)throw new Error("Cannot create a WebGPU canvas.");yn=navigator.gpu.getPreferredCanvasFormat(),an.configure({device:it,format:yn,alphaMode:"opaque"});const[x,b]=await Promise.all([fetch("./bamboo-mesh.json"),fetch("../bamboo/assets/garden.png")]);if(!x.ok||!b.ok)throw new Error("A scene asset failed to load. Reload to try again.");Un=new Float32Array(await x.json());const P=await createImageBitmap(await b.blob());if(kt){P.close();return}$t=it.createTexture({size:[P.width,P.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),it.queue.copyExternalImageToTexture({source:P},{texture:$t},[P.width,P.height]),P.close(),ut=new Qn(it),Ht=it.createBuffer({size:ut.count*80,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),kn(),Rt()}me().catch(hn);
