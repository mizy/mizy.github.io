/* Single visible canvas. WebGPU ray-marched sculpture + offscreen 2D UI texture.
   All visible controls, hit testing, focus and navigation are canvas-driven. */
'use strict';
let canvas=document.getElementById('space');
const ui=document.createElement('canvas'), ctx=ui.getContext('2d');
let W=innerWidth,H=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5), selected=0,archive=false,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,hover='',focus='',regions=[],mx=0,my=0,dirty=true,mode='INITIALIZING',gpu=null,lost=false;
const colors=['#b6c5ff','#d4bfa9','#b8d9bc','#d3b3e0','#a7dbe5'];
let touchStart=null,lastFrame=0,time=0;
const $=n=>String(n+1).padStart(2,'0');
function text(s,x,y,size=14,color='#e4e7ee',font='sans-serif',align='left'){ctx.font=`${size}px ${font}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(s,x,y)}
function line(x,y,x2,y2,color='#ffffff25'){ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}
function region(id,x,y,w,h,run,label){regions.push({id,x,y,w,h,run,label});if(focus===id){ctx.strokeStyle=colors[selected];ctx.lineWidth=1;ctx.strokeRect(x-3,y-3,w+6,h+6)}}
function button(id,label,x,y,w,run,active=false){const on=active||hover===id;ctx.fillStyle=on?'#e1e6f0':'#151920dd';ctx.fillRect(x,y,w,38);text(label,x+w/2,y+24,12,on?'#15171b':'#a8b2c4','sans-serif','center');region(id,x,y,w,38,run,label)}
function select(n){selected=(n+PROJECTS.length)%PROJECTS.length;dirty=true;canvas.setAttribute('aria-label',`${PROJECTS[selected].name}。${PROJECTS[selected].description}。方向键切换，Enter打开，A实验目录，P暂停动画。`)}
function open(url){location.assign(url)}
function wrap(s,x,y,width,size=13,color='#a5abb9'){ctx.font=`${size}px sans-serif`;let row='';for(const c of s){if(ctx.measureText(row+c).width>width){text(row,x,y,size,color);y+=23;row=''}row+=c}text(row,x,y,size,color);return y}
function drawUI(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);regions=[];const mobile=W<720,pad=mobile?23:48,p=PROJECTS[selected],accent=colors[selected];
 text('mizy',pad,42,24,'#f3f4f6','sans-serif');text('/ PROJECT SPACE',pad+64,41,10,'#8e97a9','monospace');
 button('archive',archive?'返回项目':'开源 / 实验',W-pad-104,20,104,()=>{archive=!archive;dirty=true},archive);
 line(pad,65,W-pad,65);
 if(archive){text('开源与实验',pad,122,mobile?28:38);text('EARLIER EXPLORATIONS',pad,149,10,'#818b9b','monospace');const rowH=Math.min(60,(H-230)/8);ARCHIVE.forEach((a,i)=>{let y=178+i*rowH,on=hover==='a'+i;ctx.fillStyle=on?'#c5d1ff16':'#0b0e14b8';ctx.fillRect(pad,y,W-pad*2,rowH-3);text($(i),pad+12,y+rowH*.57,10,'#7e8ba5','monospace');text(a.name,pad+48,y+rowH*.57,mobile?14:19);if(!mobile)text(a.description,W/2,y+rowH*.57,12,'#8691a4');text('↗',W-pad-18,y+rowH*.57,18,accent,'sans-serif','right');region('a'+i,pad,y,W-pad*2,rowH-3,()=>open(a.url),a.name)});
 }else{
 text('INDEPENDENT OBJECTS',pad,mobile?103:117,10,accent,'monospace');text('把想法，',pad,mobile?143:178,mobile?33:54);text('做成可以用的东西。',pad,mobile?185:242,mobile?27:44);
 if(!mobile){text('应用 · 创作 · 实验',pad,277,13,'#8a93a5');text('SELECT AN OBJECT',W-310,120,10,'#7f8a9e','monospace');PROJECTS.forEach((a,i)=>{let x=W-310,y=143+i*59,active=selected===i,on=hover==='p'+i;if(active||on){ctx.fillStyle=active?'#c4d0ff12':'#c4d0ff08';ctx.fillRect(x-12,y-20,274,49)}text($(i),x,y+5,11,active?accent:'#647086','monospace');text(a.name,x+39,y+5,active?18:16,active?'#eef0f6':'#929bad');text(active?'●':'↗',W-pad-8,y+4,11,active?accent:'#5d687b','sans-serif','right');region('p'+i,x-12,y-20,274,49,()=>select(i),a.name)})}
 const bottom=H-(mobile?166:174);line(pad,bottom,W-pad,bottom);text(`${$(selected)} / ${String(PROJECTS.length).padStart(2,'0')}`,pad,bottom+31,11,accent,'monospace');text(p.name,pad,bottom+65,mobile?27:34);const descW=mobile?W-pad*2:Math.min(470,W*.44);wrap(p.description,pad,bottom+93,descW,mobile?12:13);
 if(mobile){button('prev','←',W-pad-88,bottom+15,38,()=>select(selected-1));button('next','→',W-pad-44,bottom+15,38,()=>select(selected+1));button('open','打开项目 ↗',W-pad-122,H-48,122,()=>open(PROJECTS[selected].url),true)}else{button('prev','←',W-pad-246,bottom+31,40,()=>select(selected-1));button('next','→',W-pad-198,bottom+31,40,()=>select(selected+1));button('open','打开项目 ↗',W-pad-138,bottom+31,138,()=>open(PROJECTS[selected].url),true);text(p.kind,W-pad,bottom+101,10,'#8290a6','monospace','right')}
 }
 text(mode==='WEBGPU'?'WEBGPU / REALTIME':mode==='INITIALIZING'?'LOADING RENDERER…':'CANVAS / COMPATIBILITY',pad,H-20,8,'#637086','monospace');if(!mobile)text('← → 切换 · ENTER 打开 · A 实验',W/2,H-20,9,'#637086','monospace','center');region('pause',mobile?W-198:W-pad-85,H-31,58,23,()=>{paused=!paused;dirty=true},paused?'播放动画':'暂停动画');text(paused?'播放 ↻':'暂停 Ⅱ',mobile?W-156:W-pad,H-20,9,'#8693a9','sans-serif','right');
 dirty=false;
}
const shader=`
struct U {size:vec2f,time:f32,selection:f32,mouse:vec2f,mobile:f32,pad:f32};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var surface:texture_2d<f32>;
@group(0) @binding(2) var sam:sampler;
struct V {@builtin(position) pos:vec4f,@location(0) uv:vec2f};
@vertex fn vs(@builtin(vertex_index) i:u32)->V {var p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));var o:V;o.pos=vec4f(p[i],0,1);o.uv=p[i]*vec2f(.5,-.5)+.5;return o;}
fn rot(a:f32)->mat2x2f {return mat2x2f(cos(a),sin(a),-sin(a),cos(a));}
fn box(p:vec3f,b:vec3f)->f32 {let q=abs(p)-b;return length(max(q,vec3f(0)))+min(max(q.x,max(q.y,q.z)),0.);}
fn torus(p:vec3f,r:f32,t:f32)->f32 {return length(vec2f(length(p.xz)-r,p.y))-t;}
fn object(p0:vec3f)->f32 {
 var p=p0;let yz=rot(.37+u.mouse.y*.15)*p.yz;p=vec3f(p.x,yz);let xz=rot(u.time*.18+u.mouse.x*.3)*p.xz;p=vec3f(xz.x,p.y,xz.y);
 if(u.selection<.5){let outer=box(p,vec3f(.91))-.11;let inner=box(p,vec3f(1.3,.59,.59));let i2=box(p,vec3f(.59,1.3,.59));let i3=box(p,vec3f(.59,.59,1.3));return max(outer,-min(inner,min(i2,i3)));}
 if(u.selection<1.5){let a=torus(p-vec3f(0,.62,0),.72,.16);let b=torus(p,.91,.18);let c=torus(p+vec3f(0,.62,0),.72,.16);return min(a,min(b,c));}
 if(u.selection<2.5){var q=p;q.y-=clamp(q.y,-.6,.6);return length(q)-.58;}
 if(u.selection<3.5){let a=torus(p,.87,.16);let b=torus(p.yxz,.87,.16);let c=torus(p.xzy,.87,.16);return min(a,min(b,c));}
 let a=torus(p,.93,.13);let b=torus(p.yxz,.69,.1);let c=length(p)-.31;return min(a,min(b,c));
}
fn normal(p:vec3f)->vec3f {let e=.002;return normalize(vec3f(object(p+vec3f(e,0,0))-object(p-vec3f(e,0,0)),object(p+vec3f(0,e,0))-object(p-vec3f(0,e,0)),object(p+vec3f(0,0,e))-object(p-vec3f(0,0,e))));}
fn env(d:vec3f)->vec3f {let strip=pow(max(0.,1.-abs(d.y-.35)*2.),12.);let edge=pow(max(dot(d,normalize(vec3f(-1,1,1))),0.),20.);return vec3f(.10,.13,.19)+vec3f(.9,1.,1.2)*strip+vec3f(1.4,.9,.65)*edge;}
@fragment fn fs(v:V)->@location(0) vec4f {
 let asp=u.size.x/u.size.y;var q=(v.uv-.5)*vec2f(asp,1.);q.y=-q.y;
 var center=vec2f(.04,-.01);var scale=1.18;if(u.mobile>.5){center=vec2f(0.,-.015);scale=1.8;}q=(q-center)*scale;
 let ro=vec3f(0.,.25,5.);let rd=normalize(vec3f(q*3.5,-4.));var t=0.;var hit=false;
 for(var i=0;i<76;i++){let d=object(ro+rd*t);if(d<.0025){hit=true;break;}t+=d*.85;if(t>9.){break;}}
 var col=vec3f(.027,.035,.049);let halo=exp(-length(q)*3.);col+=vec3f(.025,.035,.067)*halo;
 if(hit){let p=ro+rd*t;let n=normal(p);let reflected=reflect(rd,n);let f=pow(1.-max(dot(-rd,n),0.),3.);let light=normalize(vec3f(-3.,5.,4.));let dif=max(dot(n,light),0.);var tint=vec3f(.54,.62,.85);if(u.selection> .5 && u.selection<1.5){tint=vec3f(.72,.58,.43);}if(u.selection>1.5 && u.selection<2.5){tint=vec3f(.47,.68,.56);}if(u.selection>2.5 && u.selection<3.5){tint=vec3f(.66,.48,.75);}if(u.selection>3.5){tint=vec3f(.40,.68,.75);}let ao=clamp(object(p+n*.18)/.18,.25,1.);col=(env(reflected)*(.47+f*.6)+tint*(dif*.32+.07))*ao;col+=pow(max(dot(reflected,light),0.),65.)*1.5;col=col/(col+vec3f(.7));}
 // Subtle orbital coordinates, never substitute for the real 3D object.
 let r=length(q*vec2f(1.,1.3));let ring=smoothstep(.0018,0.,abs(r-.54));col+=vec3f(.10,.15,.24)*ring*.6;
 let overlay=textureSample(surface,sam,v.uv);col=mix(col,overlay.rgb,overlay.a);return vec4f(col,1.);
}`;
async function initGPU(){if(!navigator.gpu)throw Error('WebGPU unavailable');const adapter=await navigator.gpu.requestAdapter({powerPreference:'low-power'});if(!adapter)throw Error('No adapter');const device=await adapter.requestDevice();const context=canvas.getContext('webgpu');const format=navigator.gpu.getPreferredCanvasFormat();context.configure({device,format,alphaMode:'opaque'});const module=device.createShaderModule({code:shader});const info=await module.getCompilationInfo();if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.map(m=>m.message).join('\n'));const pipeline=await device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'vs'},fragment:{module,entryPoint:'fs',targets:[{format}]},primitive:{topology:'triangle-list'}});const buffer=device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});gpu={device,context,pipeline,buffer};device.lost.then(()=>{lost=true;useFallback();});sizeGPU();mode='WEBGPU';dirty=true;}
function sizeGPU(){if(!gpu)return;const {device,pipeline,buffer}=gpu;if(gpu.texture)gpu.texture.destroy();gpu.texture=device.createTexture({size:[canvas.width,canvas.height],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});gpu.group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer}},{binding:1,resource:gpu.texture.createView()},{binding:2,resource:device.createSampler({magFilter:'linear',minFilter:'linear'})}]});dirty=true;}
function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=ui.width=Math.round(W*dpr);canvas.height=ui.height=Math.round(H*dpr);sizeGPU();dirty=true}resize();addEventListener('resize',resize);
let fallback=null;
function frame(now){requestAnimationFrame(frame);if(document.hidden||now-lastFrame<32||(paused&&!dirty))return;const delta=Math.min((now-lastFrame)/1000,.05);lastFrame=now;if(!paused)time+=delta;const changed=dirty;if(dirty)drawUI();if(gpu&&!lost){const {device,context,pipeline,buffer,group,texture}=gpu;if(changed)device.queue.copyExternalImageToTexture({source:ui},{texture},[canvas.width,canvas.height]);device.queue.writeBuffer(buffer,0,new Float32Array([canvas.width,canvas.height,time,selected,mx,my,W<720?1:0,0]));const encoder=device.createCommandEncoder();const pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),loadOp:'clear',storeOp:'store',clearValue:{r:0,g:0,b:0,a:1}}]});pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.draw(3);pass.end();device.queue.submit([encoder.finish()]);}else if(fallback){fallback.setTransform(dpr,0,0,dpr,0,0);fallback.fillStyle='#090c12';fallback.fillRect(0,0,W,H);fallback.save();fallback.translate(W*.5,H*.49);fallback.rotate(time*.09);for(let j=0;j<5;j++){fallback.strokeStyle=colors[selected]+(j===selected?'dd':'44');fallback.lineWidth=j===selected?2:1;fallback.beginPath();fallback.ellipse(0,0,Math.min(W*.25,150),45+j*11,j*.5,0,Math.PI*2);fallback.stroke()}fallback.restore();fallback.drawImage(ui,0,0,W,H)}}
function bindInputs(){canvas.addEventListener('pointermove',e=>{mx=(e.clientX/W-.5)*2;my=(e.clientY/H-.5)*2;const r=regions.find(r=>e.clientX>=r.x&&e.clientX<=r.x+r.w&&e.clientY>=r.y&&e.clientY<=r.y+r.h);const id=r?.id||'';if(id!==hover){hover=id;dirty=true}canvas.style.cursor=r?'pointer':'default'});
canvas.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};canvas.focus()});
canvas.addEventListener('pointerup',e=>{if(!touchStart)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)&&!archive){select(selected+(dx<0?1:-1));return}if(Math.abs(dx)>12||Math.abs(dy)>12)return;const r=regions.find(r=>e.clientX>=r.x&&e.clientX<=r.x+r.w&&e.clientY>=r.y&&e.clientY<=r.y+r.h);if(r){focus=r.id;r.run();dirty=true}});
canvas.addEventListener('keydown',e=>{if(e.key==='Tab'){let i=regions.findIndex(r=>r.id===focus);i=i+(e.shiftKey?-1:1);if(i<0||i>=regions.length){focus='';canvas.blur();dirty=true;return}e.preventDefault();focus=regions[i].id;dirty=true}else if(e.key==='Enter'||e.key===' '){e.preventDefault();const r=regions.find(r=>r.id===focus);if(r)r.run();else if(!archive)open(PROJECTS[selected].url);dirty=true}else if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();select(selected+1)}else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();select(selected-1)}else if(e.key.toLowerCase()==='a'){archive=!archive;focus='';dirty=true}else if(e.key==='Escape'){archive=false;focus='';dirty=true}else if(e.key.toLowerCase()==='p'){paused=!paused;dirty=true}});
}
function useFallback(){const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;gpu=null;fallback=canvas.getContext('2d');mode='CANVAS / COMPATIBILITY';bindInputs();resize();dirty=true;}
bindInputs();
if(new URLSearchParams(location.search).has('compat')){useFallback()}else{initGPU().catch(e=>{console.warn('Canvas compatibility mode:',e.message);useFallback()})}requestAnimationFrame(frame);
