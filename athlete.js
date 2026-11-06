/* Original articulated athlete: anatomical surface profiles, two-bone arms and phased strokes. */
class AthleteRig {
 // Batch rigid anatomy per material; animated joints remain separate.
 static batch(group,chosen=null){const T=THREE;group.updateMatrixWorld(true);const inverse=new T.Matrix4().copy(group.matrixWorld).invert(),buckets=new Map(),meshes=[];if(chosen)meshes.push(...chosen);else group.traverse(o=>{if(o.isMesh)meshes.push(o)});
  for(const mesh of meshes){const key=mesh.material;let list=buckets.get(key);if(!list)buckets.set(key,list=[]);const transform=new T.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld);list.push(mesh.geometry.clone().applyMatrix4(transform));mesh.removeFromParent()}
  for(const [material,geometries] of buckets){const positions=[],normals=[],uvs=[],indices=[];let offset=0;for(const g of geometries){const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv');positions.push(...p.array);normals.push(...n.array);if(uv)uvs.push(...uv.array);else for(let i=0;i<p.count;i++)uvs.push(0,0);if(g.index)for(let i=0;i<g.index.count;i++)indices.push(g.index.array[i]+offset);else for(let i=0;i<p.count;i++)indices.push(i+offset);offset+=p.count;g.dispose()}const merged=new T.BufferGeometry();merged.setAttribute('position',new T.Float32BufferAttribute(positions,3));merged.setAttribute('normal',new T.Float32BufferAttribute(normals,3));merged.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));merged.setIndex(indices);merged.computeBoundingSphere();group.add(new T.Mesh(merged,material))}
 }

 static build(v,root,id,color,dark,skin){
  const T=THREE,body=new T.Group();body.position.set(-.25,.48,0);root.add(body);
  const form=(parent,c,x,y,z,sx,sy,sz,r=.7)=>{let o=v.mesh(new T.SphereGeometry(1,24,16),v.mat(c,r),parent,x,y,z);o.scale.set(sx,sy,sz);return o};
  const profile=(rows,c,parent)=>{const verts=[],ind=[],n=32;for(let [y,rx,rz,cx] of rows)for(let j=0;j<n;j++){let a=j/n*Math.PI*2;verts.push(cx+rx*Math.cos(a),y,rz*Math.sin(a))}for(let i=0;i<rows.length-1;i++)for(let j=0;j<n;j++){let a=i*n+j,b=i*n+(j+1)%n;ind.push(a,a+n,b,b,a+n,b+n)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex(ind);g.computeVertexNormals();return v.mesh(g,v.mat(c,.83),parent)};
  // Waist, ribs, chest and shoulder line have individual cross sections.
  profile([[0,.13,.2,0],[.12,.18,.23,0],[.32,.2,.28,0],[.57,.23,.35,-.015],[.75,.2,.37,-.03],[.83,.13,.26,-.045],[.9,.09,.1,-.04]],dark,body);
  form(body,dark,.05,.08,0,.25,.16,.31);
  for(let side of [-1,1]){
   form(body,color,.13,.53,side*.17,.17,.28,.175);
   form(body,dark,-.05,.77,side*.36,.16,.17,.15);
   form(body,skin,-.01,.75,side*.4,.115,.13,.115);
   // PFD webbing follows the chest contour, with separate buckles.
   v.tube(new T.Vector3(.1,.79,side*.24),new T.Vector3(.285,.43,side*.22),.026,'#182d35',body);
   v.box(.035,.065,.085,'#9baba9',body,.294,.43,side*.22);
  }
  v.tube(new T.Vector3(.28,.38,-.3),new T.Vector3(.28,.38,.3),.025,'#20363d',body);
  form(body,color,-.17,.53,0,.11,.3,.29);
  const neck=v.mesh(new T.CylinderGeometry(.095,.115,.19,16),v.mat(skin,.7),body,-.025,.91,0);
  const head=new T.Group();head.position.set(-.015,1.14,0);body.add(head);
  form(head,skin,0,0,0,.176,.222,.165,.65);form(head,skin,.025,-.135,0,.139,.095,.14,.65);
  for(let side of [-1,1]){
   form(head,skin,.075,-.035,side*.105,.1,.09,.065);
   form(head,skin,-.035,-.015,side*.171,.038,.072,.027);
   form(head,'#e8e2d2',.153,.037,side*.074,.025,.023,.037,.4);
   form(head,'#35484a',.173,.036,side*.074,.012,.016,.017,.3);
   v.tube(new T.Vector3(.15,.072,side*.04),new T.Vector3(.14,.078,side*.115),.013,'#544238',head);
   v.tube(new T.Vector3(-.015,.12,side*.173),new T.Vector3(.07,-.18,side*.115),.012,'#23353c',head);
  }
  form(head,skin,.18,-.018,0,.052,.047,.033);form(head,'#9c6855',.151,-.104,0,.012,.012,.059);
  const helmet=v.mesh(new T.SphereGeometry(.215,28,18,0,Math.PI*2,0,Math.PI*.55),v.mat(id<5?'#eeeede':'#f1d7bc',.32),head,-.022,.066,0);helmet.scale.set(1.08,1,1.02);
  for(let side of [-1,1])for(let j=0;j<3;j++)form(head,'#53666b',-.09+j*.065,.241,side*.07,.022,.009,.015);
  const stripe=v.mesh(new T.TorusGeometry(.213,.012,6,36,Math.PI),v.mat(color),head,-.02,.063,0);stripe.rotation.y=Math.PI/2;
  this.batch(head);this.batch(body,body.children.filter(o=>o.isMesh));
  const arms=[];
  for(let side of [-1,1]){
   const upper=profile([[-.5,.062,.065,0],[-.34,.09,.085,0],[0,.106,.09,.01],[.27,.092,.087,0],[.5,.083,.08,0]],skin,body);
   const fore=profile([[-.5,.043,.047,0],[-.29,.052,.058,0],[.06,.074,.067,0],[.32,.078,.068,0],[.5,.068,.065,0]],skin,body);
   const elbow=form(body,skin,0,0,0,.073,.073,.073);
   const hand=new T.Group();body.add(hand);form(hand,skin,0,0,0,.058,.09,.033);
   const fingers=[];for(let j=0;j<4;j++){let finger=new T.Group();finger.position.set(-.042+j*.027,.055,0);hand.add(finger);form(finger,skin,0,.034,.012,.013,.043,.014);form(finger,skin,0,.063,.035,.012,.021,.02);fingers.push(finger)}
   form(hand,skin,-.063,.005,.014,.026,.044,.022);
   this.batch(hand);
   arms.push({upper,fore,elbow,hand,fingers:[],side,position:new T.Vector3(.3,.6,side*.55)});
  }
  // Carbon shaft, offset feathered blades, rubber grip bands.
  const paddle=new T.Group();body.add(paddle);const shaft=v.mesh(new T.CylinderGeometry(.022,.022,2.6,12),v.mat('#182a32',.38),paddle);shaft.rotation.x=Math.PI/2;
  for(let side of [-1,1]){let blade=form(paddle,'#d8dfd2',0,0,side*1.34,.195,.025,.39,.32);blade.rotation.z=side*.13;v.box(.055,.027,.3,color,paddle,0,.024,side*1.35);const grip=v.mesh(new T.CylinderGeometry(.027,.027,.14,10),v.mat('#42575a',.9),paddle,0,0,side*.53);grip.rotation.x=Math.PI/2}
  this.batch(paddle);
  // A real surface number, rather than a floating number on the chest.
  const c=document.createElement('canvas');c.width=128;c.height=128;const q=c.getContext('2d');q.fillStyle='#f1f6df';q.font='bold 83px sans-serif';q.textAlign='center';q.fillText(String(id%5+1),64,93);const badge=v.mesh(new T.PlaneGeometry(.2,.25),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false}),body,.308,.58,0);badge.rotation.y=Math.PI/2;
  return {body,head,arms,paddle,phase:id*1.7,paddleBlend:0,poseBlend:0};
 }
 static stroke(phase,effort){
  // Each half-cycle contains entry, submerged pull, extraction and airborne recovery.
  const side=Math.floor(phase/Math.PI)%2===0?1:-1,u=(phase%Math.PI)/Math.PI;
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
  let x,y,tilt,wet=false;
  if(u<.18){const k=smooth(u/.18);x=.52;y=.63-k*.13;tilt=.2+k*.53}
  else if(u<.64){const k=smooth((u-.18)/.46);x=.52-k*.7;y=.5;tilt=.73;wet=true}
  else if(u<.8){const k=smooth((u-.64)/.16);x=-.18;y=.5+k*.19;tilt=.73-k*.56}
  else{const k=smooth((u-.8)/.2);x=-.18+k*.7;y=.69-k*.06;tilt=.17}
  return {x:.26+(x-.26)*effort,y:.55+(y-.55)*effort,tilt:side*tilt*effort,yaw:side*(x-.15)*.5*effort,side,wet:wet&&effort>.25,u};
 }
 static handPose(b,wind,holding,catching){const T=THREE,a=b.action;
  let hand=new T.Vector3(.34,.87,.35),lean=0,twist=0;
  if(wind){hand.set(.18-.43*wind,1.04+.28*wind,.39);lean=-.28*wind;twist=-.33*wind}
  if(a){const u=a.time/a.releaseAt;
   if(a.shot&&u<=1){const k=u;hand.set(-.25+.92*k,1.32-.13*k,.39-.23*k);lean=-.25+.37*k;twist=-.32+.58*k}
   else if(u<.55){const k=u/.55;hand.set(.18-.43*k,1.04+.28*k,.39);lean=-.25*k;twist=-.32*k}
   else if(u<=1){const k=(u-.55)/.45;hand.set(-.25+.92*k,1.32-.13*k,.39-.23*k);lean=-.25+.37*k;twist=-.32+.58*k}
   else{const k=Math.min(1,(a.time-a.releaseAt)/(a.duration-a.releaseAt));hand.set(.67-.33*k,1.19-.32*k,.16+.19*k);lean=.18*Math.sin((1-k)*Math.PI*.5);twist=.24*(1-k)}
  }
  return {hand,lean,twist};
 }
}
