/* Original procedural 3D arena and animation. Three.js MIT, see vendor license. */
class WaterArena {
 constructor(canvas){
  const T=THREE;this.T=T;this.canvas=canvas;this.mode=1;this.models=[];this.target=new T.Vector3();this.projected=[];
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
  this.scene=new T.Scene();this.scene.background=new T.Color('#b8d6dd');this.scene.fog=new T.Fog('#b8d6dd',180,330);
  this.camera=new T.PerspectiveCamera(42,1,.1,500);this.camera.position.set(0,16.5,19.8);this.camera.lookAt(0,0,0);
  this.scene.add(new T.HemisphereLight(0xd6efff,0x304653,1.55));const sun=new T.DirectionalLight(0xffead1,3.1);sun.position.set(-25,50,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-36,right:36,top:30,bottom:-30,near:1,far:110});sun.shadow.bias=-.00025;sun.shadow.normalBias=.025;this.scene.add(sun);
  this.materials={};this.setupArena();for(let i=0;i<10;i++)this.models.push(this.makePlayer(i));
  this.ball=this.mesh(new T.SphereGeometry(.30,24,16),this.mat('#ffda58',.3));this.scene.add(this.ball);const seam=new T.Mesh(new T.TorusGeometry(.298,.012,6,32),this.mat('#293b47'));this.ball.add(seam);const seam2=seam.clone();seam2.rotation.y=Math.PI/2;this.ball.add(seam2);
  this.ballShadow=this.mesh(new T.CircleGeometry(.36,20),new T.MeshBasicMaterial({color:0x052f44,transparent:true,opacity:.26,depthWrite:false}));this.ballShadow.rotation.x=-Math.PI/2;this.scene.add(this.ballShadow);
  this.route=new T.Line(new T.BufferGeometry(),new T.LineDashedMaterial({color:0xeaffb3,dashSize:.35,gapSize:.25,transparent:true,opacity:.7}));this.scene.add(this.route);
  this.ripples=[];const ringGeom=new T.RingGeometry(.8,1,24);for(let i=0;i<70;i++){let r=this.mesh(ringGeom,new T.MeshBasicMaterial({color:0xb8f8ef,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));r.rotation.x=-Math.PI/2;this.scene.add(r);this.ripples.push(r)}
  this.sprayData=Array.from({length:180},()=>({life:0,p:new T.Vector3(),v:new T.Vector3()}));this.sprayCursor=0;this.sprayMesh=new T.InstancedMesh(new T.SphereGeometry(.035,6,4),new T.MeshBasicMaterial({color:0xd9f8ed,transparent:true,opacity:.75}),180);this.sprayMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.sprayMesh.frustumCulled=false;this.scene.add(this.sprayMesh);this.sprayDummy=new T.Object3D();
  this.resize();
 }
 mat(c,r=.65){return this.materials[c+','+r]??=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:.025})}
 mesh(g,m,parent,x=0,y=0,z=0){let o=new THREE.Mesh(g,m);o.position.set(x,y,z);if(parent)parent.add(o);return o}
 box(x,y,z,c,parent,px=0,py=0,pz=0){return this.mesh(new THREE.BoxGeometry(x,y,z),this.mat(c),parent,px,py,pz)}
 tube(a,b,r,c,parent=this.scene){let v=new THREE.Vector3().subVectors(b,a),o=this.mesh(new THREE.CylinderGeometry(r,r,v.length(),8),this.mat(c),parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o}
 label(text,color='#eaffce',w=256){const c=document.createElement('canvas');c.width=w;c.height=64;const q=c.getContext('2d');q.fillStyle=color;q.font='700 29px sans-serif';q.textAlign='center';q.fillText(text,w/2,43);const tex=new THREE.CanvasTexture(c),s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));s.scale.set(w/80,.8,1);return s}
 setupArena(){const T=THREE,sc=this.scene;
  this.box(90,.8,70,'#cbd2c8',sc,0,-.7,0);this.box(51.5,.7,29.5,'#0f4857',sc,0,-.7,0);
  this.waterMat=new T.ShaderMaterial({uniforms:{uTime:{value:0}},vertexShader:`varying vec3 p;void main(){p=position;vec3 v=position;v.z+=sin(position.x*2.1+position.y*.7)*.01;gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);}`,fragmentShader:`uniform float uTime;varying vec3 p;void main(){float w=sin(p.x*2.2+p.y*.8+uTime*1.5)*sin(p.y*3.1-p.x*.4-uTime*.9);float f=pow(max(0.,sin(p.x*1.8+p.y*2.9+sin(p.x*.8+uTime)*.7-uTime)),28.);float grid=pow(max(0.,cos(p.x*6.28)*cos(p.y*6.28)),12.);vec3 c=mix(vec3(.025,.24,.34),vec3(.06,.54,.59),(p.y+16.)/32.);c+=w*.023+f*.075+grid*.018;gl_FragColor=vec4(c,1.);}`});
  const water=this.mesh(new T.PlaneGeometry(50,28,80,50),this.waterMat,sc);water.rotation.x=-Math.PI/2;const contact=this.mesh(new T.PlaneGeometry(50,28),new T.ShadowMaterial({opacity:.25,depthWrite:false}),sc,0,.018,0);contact.rotation.x=-Math.PI/2;contact.receiveShadow=true;
  for(let z of [-14.5,14.5]){this.box(52,.45,.65,'#f0e9d5',sc,0,.1,z);for(let x=-25;x<=25;x+=1){let f=this.mesh(new T.SphereGeometry(.14,8,6),this.mat(x<0?'#5ee3c3':'#f7a876'),sc,x,.12,z>0?13.85:-13.85)}}
  for(let x of [-25.5,25.5])this.box(.65,.45,28,'#f0e9d5',sc,x,.1,0);
  // Submerged lane markings and floating center markers.
  for(let z=-13;z<=13;z+=.8)this.mesh(new T.SphereGeometry(.07,6,5),this.mat('#d0ede2'),sc,0,.06,z);
  const center=this.mesh(new T.RingGeometry(3.1,3.15,64),new T.MeshBasicMaterial({color:0xc7efe5,transparent:true,opacity:.35,side:T.DoubleSide}),sc,0,.04,0);center.rotation.x=-Math.PI/2;
  for(let sign of [-1,1]){let x=sign*25.2,c=sign<0?'#51d9b3':'#ff9e70';for(let z of [-3.35,3.35]){this.tube(new T.Vector3(x,0,z),new T.Vector3(x,4.3,z),.08,'#e6efeb');this.tube(new T.Vector3(x,4.3,z),new T.Vector3(x+sign*1.3,4.3,z),.06,c)}for(let h of [1.9,4.3])this.tube(new T.Vector3(x,h,-3.35),new T.Vector3(x,h,3.35),.085,c);const pts=[];for(let z=-3.35;z<=3.36;z+=.3)pts.push(x+sign*1.3,1.9,z,x+sign*1.3,4.3,z);for(let h=1.9;h<=4.31;h+=.25)pts.push(x+sign*1.3,h,-3.35,x+sign*1.3,h,3.35);for(let z of [-3.35,3.35])for(let h=1.9;h<=4.31;h+=.3)pts.push(x,h,z,x+sign*1.3,h,z);const net=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(pts,3)),new T.LineBasicMaterial({color:0xe9ffff,transparent:true,opacity:.6}));sc.add(net)}
  // Tiered arena seats with instanced spectators keep mobile draw calls low.
  for(let side of [-1,1])for(let row=0;row<2;row++)this.box(55,.45,1.0,row%2?'#2a4c5c':'#395e6b',sc,0,.5+row*.65,side*(16+row*1.0));
  let geo=new T.CapsuleGeometry(.19,.35,2,5),people=new T.InstancedMesh(geo,this.mat('#7ca5b4'),168),dummy=new T.Object3D(),n=0;for(let side of [-1,1])for(let row=0;row<2;row++)for(let col=0;col<42;col++){dummy.position.set((col-20.5)*1.25,.9+row*.65,side*(16+row*1.0));dummy.scale.setScalar(.8+((col*7+row)%5)*.08);dummy.updateMatrix();people.setMatrixAt(n,dummy.matrix);people.setColorAt(n++,new T.Color(['#d6d9c8','#203c52','#e89c71','#74b5b6','#b8c1c2'][(col+row*3)%5]))}sc.add(people);
  for(let x of [-22,-11,0,11,22]){this.box(9,1.1,.2,'#132e42',sc,x,.65,-16);let label=this.label(x===0?'PADDLE  /  WATER ARENA':'TIDAL    •    CORAL','#d3efc3',512);label.position.set(x,.8,-15.8);label.scale.set(8,1,1);sc.add(label)}
  for(let x of [-31,31])for(let z of [-23,23]){this.box(.22,14,.22,'#647d86',sc,x,6.5,z);this.box(4,.5,.6,'#ecf4df',sc,x,13.5,z)}
 }
 makePlayer(id){const T=THREE,root=new T.Group();this.scene.add(root);const team=id<5?0:1,color=team?'#ef845e':'#52d9bc',dark=team?'#772f2a':'#13545e',skin=['#cf956f','#935e42','#e2b18b','#b47b56','#d5a17a'][id%5];
  // Tapered hull sections give the bow and stern a real keel instead of an oval.
  const vertices=[],indices=[],sections=26,sides=20;
  for(let i=0;i<=sections;i++){let u=i/sections,x=(u-.5)*4.25,w=Math.pow(Math.sin(Math.PI*u),.72)*.49;for(let j=0;j<sides;j++){let q=j/sides*Math.PI*2;vertices.push(x,.22+Math.cos(q)*(.22*Math.sin(Math.PI*u)+.025),Math.sin(q)*w)}}
  for(let i=0;i<sections;i++)for(let j=0;j<sides;j++){let n=i*sides+j,k=i*sides+(j+1)%sides;indices.push(n,k,n+sides,k,k+sides,n+sides)}
  const hullGeo=new T.BufferGeometry();hullGeo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));hullGeo.setIndex(indices);hullGeo.computeVertexNormals();this.mesh(hullGeo,this.mat(color,.24),root).castShadow=true;
  const cockpit=this.mesh(new T.SphereGeometry(1,24,12),this.mat('#112631'),root,-.27,.44,0);cockpit.scale.set(.69,.1,.37);
  const rim=this.mesh(new T.TorusGeometry(.46,.045,8,32),this.mat('#263943'),root,-.27,.48,0);rim.rotation.x=Math.PI/2;rim.scale.set(1.4,.77,1);
  this.box(1.1,.025,.055,'#f2f3d6',root,.95,.43,0);for(let z of [-.21,.21]){this.tube(new T.Vector3(.65,.43,z),new T.Vector3(1.3,.37,-z),.018,dark,root)}
  const rig=RiggedAthlete.build(this,root,id,color,dark);
  const ring=this.mesh(new T.RingGeometry(1.35,1.65,64),new T.MeshBasicMaterial({color:0xe5ff3d,side:T.DoubleSide,transparent:true,opacity:1,depthWrite:false}),this.scene);ring.rotation.x=-Math.PI/2;
  const shadow=this.mesh(new T.CircleGeometry(1,24),new T.MeshBasicMaterial({color:0x002d41,transparent:true,opacity:.1,depthWrite:false}),this.scene);shadow.rotation.x=-Math.PI/2;shadow.scale.set(1.85,.64,1);
  const label=this.label(String(id%5+1),'#f3ffef',64);this.scene.add(label);const controlTag=this.label('▼  你','#edff67',128);controlTag.scale.set(1.8,.9,1);controlTag.renderOrder=20;this.scene.add(controlTag);
  const splash=this.mesh(new T.RingGeometry(.12,.18,20),new T.MeshBasicMaterial({color:0xe8fffa,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}),this.scene);splash.rotation.x=-Math.PI/2;
  return {...rig,root,ring,shadow,label,controlTag,splash,lean:0,twist:0,handWorld:new T.Vector3(),lastYaw:0,wet:false};
 }
 limb(mesh,a,b){let v=new THREE.Vector3().subVectors(b,a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=v.length();mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize())}
 emitSpray(p,angle,power){for(let i=0;i<3;i++){const d=this.sprayData[this.sprayCursor++%this.sprayData.length];d.life=.35+Math.random()*.2;d.p.copy(p);d.p.y=.08;d.v.set(-Math.cos(angle)*(1+Math.random())+(Math.random()-.5),1.1+Math.random()*power,-Math.sin(angle)+(Math.random()-.5)*2)}}
 updateSpray(dt){for(let i=0;i<this.sprayData.length;i++){const d=this.sprayData[i];d.life-=dt;if(d.life>0){d.p.addScaledVector(d.v,dt);d.v.y-=dt*6;this.sprayDummy.position.copy(d.p);this.sprayDummy.scale.setScalar(d.p.y>0?Math.min(1,d.life*5):0)}else this.sprayDummy.scale.setScalar(0);this.sprayDummy.updateMatrix();this.sprayMesh.setMatrixAt(i,this.sprayDummy.matrix)}this.sprayMesh.instanceMatrix.needsUpdate=true}
 resize(){let w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.frameKey=null}
 frameCamera(focus,dt){
  const T=THREE,w=innerWidth,h=innerHeight,compact=h<=500;
  // Action view prioritizes readable athletes and ball movement. Full-pitch
  // framing is available only in overview mode; never zoom out to fit both goals.
  if(this.mode===1){
   const scale=Math.max(1,1.4/(w/h)),dir=focus?.team===1?-1:1;
   const target=new T.Vector3(T.MathUtils.clamp(((focus?.x??500)-500)*.05+dir*2.5,-24,24),.6,T.MathUtils.clamp(((focus?.y??280)-280)*.05,-12,12));
   const entering=this.lastCameraMode!==1;
   if(entering)this.target.copy(target);else this.target.lerp(target,1-Math.exp(-dt*5.5));
   this.camera.clearViewOffset();
   const pos=new T.Vector3(this.target.x,8.5*scale,this.target.z+13.5*scale);
   if(entering)this.camera.position.copy(pos);else this.camera.position.lerp(pos,1-Math.exp(-dt*7));
   this.camera.lookAt(this.target);this.camera.updateMatrixWorld(true);
   this.lastCameraMode=1;this.frameKey=null;this.frameBounds=null;return;
  }
  this.lastCameraMode=0;
  // Controls float over the near sideline instead of reserving a large empty band.
  const top=compact?62:80,bottom=h-18,left=w*.018,right=w*.982;
  const key=`${w}:${h}:${this.mode}`;
  if(this.frameKey===key)return;
  this.frameKey=key;this.target.set(0,0,0);
  // Match the pitch's apparent depth to the available aspect ratio: flatter on a
  // wide phone, steeper in a narrow window. Both goals remain fully on screen.
  const sine=T.MathUtils.clamp((bottom-top)/(right-left)*1.82,.42,.975);
  const slope=sine/Math.sqrt(1-sine*sine)*(this.mode===1?1:1.3);
  const points=[[-26.5,0,-14.8],[26.5,0,-14.8],[-26.5,0,14.8],[26.5,0,14.8],[-26.5,4.8,-4],[-26.5,4.8,4],[26.5,4.8,-4],[26.5,4.8,4]];
  this.camera.clearViewOffset();
  const bounds=d=>{
   this.camera.position.set(0,d*slope,d);this.camera.lookAt(this.target);this.camera.updateMatrixWorld(true);
   let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
   for(const point of points){const p=new T.Vector3(...point).project(this.camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
   return {minX,maxX,minY,maxY};
  };
  let lo=8,hi=180;for(let i=0;i<16;i++){const mid=(lo+hi)/2,b=bounds(mid);if(b.maxX-b.minX<=right-left&&b.maxY-b.minY<=bottom-top)hi=mid;else lo=mid}
  const b=bounds(hi*1.003);
  this.camera.setViewOffset(w,h,(b.minX+b.maxX)/2-(left+right)/2,(b.minY+b.maxY)/2-(top+bottom)/2,w,h);
  this.frameBounds={top,bottom,left,right};
 }

 project(x,y,h=1){return new THREE.Vector3((x-500)*.05,h,(y-280)*.05).project(this.camera)}
 direction(x,y){let f=new THREE.Vector3();this.camera.getWorldDirection(f);f.y=0;f.normalize();return {x:-f.z*x-f.x*y,y:f.x*x-f.z*y}}
 pick(x,y,boats){let best=null,d=32;for(let b of boats.filter(b=>b.team===0)){let p=this.project(b.x,b.y,1),dx=(p.x+1)*innerWidth/2-x,dy=(1-p.y)*innerHeight/2-y,n=Math.hypot(dx,dy);if(p.z<1&&n<d){d=n;best=b}}return best}
 render(s){const T=THREE,{boats,ball,selected,elapsed,charging,charge,pick,dt}=s;let t=elapsed;
  const focus=ball.owner>=0?boats[ball.owner]:{x:ball.x,y:ball.y,team:ball.lastTeam};
  this.frameCamera(focus,dt);this.waterMat.uniforms.uTime.value=t;
  for(let i=0;i<10;i++){let m=this.models[i],b=boats[i];m.root.visible=m.ring.visible=m.shadow.visible=m.label.visible=m.controlTag.visible=m.splash.visible=!!b;if(!b)continue;
   const speed=Math.hypot(b.vx,b.vy),effort=Math.min(1,speed/140);const wrapAngle=v=>Math.atan2(Math.sin(v),Math.cos(v)),bank=T.MathUtils.clamp(wrapAngle(b.a-m.lastYaw)/Math.max(dt,.016),-3,3)*.018;m.lastYaw=b.a;
   m.root.position.set((b.x-500)*.05,Math.sin(t*2+i)*.008,(b.y-280)*.05);m.root.rotation.set(bank,-b.a,Math.sin(t*2+i)*.008*effort);m.root.updateMatrixWorld(true);
   const stroke=RiggedAthlete.update(m,b,s,dt),blade=new T.Vector3(-stroke.side*1.2,0,0);m.paddle.localToWorld(blade);const wet=m.kind==='paddle'&&stroke.wet&&blade.y<.32;
   m.splash.position.set(blade.x,.05,blade.z);m.splash.material.opacity=wet?.32:0;m.splash.scale.set(1.3,.65,1);
   if(wet&&dt>0){m.sprayClock=(m.sprayClock||0)+dt;if(m.sprayClock>.045){m.sprayClock=0;this.emitSpray(blade,b.a,effort)}}
   m.ring.visible=b.id===selected||(pick&&pick.id===b.id);m.ring.position.set(m.root.position.x,.08,m.root.position.z);m.ring.material.color.set(b.id===selected?0xe5ff3d:0x74d9ff);m.ring.material.opacity=b.id===selected?1:.45;m.ring.scale.setScalar(b.id===selected?1+.035*Math.sin(t*4):.8);m.controlTag.visible=b.id===selected;m.controlTag.position.copy(m.root.position).add(new T.Vector3(0,3.05,0));m.shadow.position.set(m.root.position.x,.025,m.root.position.z);m.shadow.rotation.z=b.a;m.label.position.copy(m.root.position).add(new T.Vector3(0,2.2,0));m.label.material.opacity=b.id===selected?1:.5;
  }
  let h=ball.h??.25;if(ball.owner>=0){let m=this.models[ball.owner];this.ball.position.copy(m.handWorld);let b=boats[ball.owner];if(b.catchAnim>.24&&b.catchOrigin){const origin=new T.Vector3((b.catchOrigin.x-500)*.05,b.catchOrigin.h,(b.catchOrigin.y-280)*.05);this.ball.position.lerp(origin,(b.catchAnim-.24)/.14)}h=this.ball.position.y}else this.ball.position.set((ball.x-500)*.05,h,(ball.y-280)*.05);this.ball.rotation.z=t*5;this.ballShadow.position.set(this.ball.position.x,.035,this.ball.position.z);this.ballShadow.material.opacity=.3/(1+h*.3);
  let rIndex=0;for(let b of boats){let speed=Math.hypot(b.vx,b.vy);for(let j=0;j<6;j++){let r=this.ripples[rIndex++],phase=((t*1.4+j/6)%1),len=.6+phase*2.7;r.position.set((b.x-500)*.05-Math.cos(b.a)*len,.04,(b.y-280)*.05-Math.sin(b.a)*len);r.scale.set(.25+phase*.9,.15+phase*.45,1);r.material.opacity=(1-phase)*.19*Math.min(speed/100,1)}}for(;rIndex<this.ripples.length;rIndex++)this.ripples[rIndex].material.opacity=0;
  this.route.visible=!!pick;if(pick){let b=boats[pick.id],points=[new T.Vector3((b.x-500)*.05,.14,(b.y-280)*.05),new T.Vector3((pick.phase==='roll'?870:pick.x)-500,.14,0)];points[1].set(((pick.phase==='roll'?870:pick.x)-500)*.05,.14,((pick.phase==='roll'?280:pick.y)-280)*.05);this.route.geometry.dispose();this.route.geometry=new T.BufferGeometry().setFromPoints(points);this.route.computeLineDistances()}
  const meter=document.querySelector('#shotmeter');meter.hidden=!charging;if(charging){let b=boats[selected],p=this.project(b.x,b.y,2.6),w=s.window;meter.style.left=`${T.MathUtils.clamp((p.x+1)*innerWidth/2+22,16,innerWidth-35)}px`;meter.style.top=`${T.MathUtils.clamp((1-p.y)*innerHeight/2-35,90,innerHeight-140)}px`;document.querySelector('#meterfill').style.height=Math.min(charge,1)*100+'%';document.querySelector('#meterzone').style.bottom=(w.center-w.width/2)*100+'%';document.querySelector('#meterzone').style.height=w.width*100+'%'}
  const mc=document.querySelector('#minimap'),mq=mc.getContext('2d');mq.clearRect(0,0,140,80);mq.fillStyle='#082b3dbb';mq.fillRect(0,0,140,80);mq.strokeStyle='#a1d7cf66';mq.strokeRect(5,5,130,70);mq.beginPath();mq.moveTo(70,5);mq.lineTo(70,75);mq.stroke();for(let b of boats){mq.fillStyle=b.id===selected?'#efffa4':b.team?'#f4a17d':'#78e6cc';mq.beginPath();mq.arc(5+b.x*.13,5+b.y*.125,b.id===selected?3:2,0,6.29);mq.fill()}mq.fillStyle='#ffe05c';mq.fillRect(4+ball.x*.13,4+ball.y*.125,3,3);
  this.updateSpray(dt);this.renderer.render(this.scene,this.camera);
 }
}
