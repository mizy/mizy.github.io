/* WebGPU is an optional image treatment, not the page renderer or a model viewer.
   The actual preview image and all navigation remain standard HTML. */
(async()=>{
 const c=document.getElementById('preview-gpu'),img=document.getElementById('model-preview'),host=img.parentElement;
 if(!navigator.gpu||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 let device,active=true,frame=0,tx=0,ty=0,x=0,y=0;
 try{
  await img.decode();const adapter=await navigator.gpu.requestAdapter({powerPreference:'low-power'});if(!adapter)return;device=await adapter.requestDevice();
  const context=c.getContext('webgpu'),format=navigator.gpu.getPreferredCanvasFormat();context.configure({device,format,alphaMode:'opaque'});
  const bitmap=await createImageBitmap(img),texture=device.createTexture({size:[bitmap.width,bitmap.height],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});device.queue.copyExternalImageToTexture({source:bitmap},{texture},[bitmap.width,bitmap.height]);bitmap.close();
  const shader=device.createShaderModule({code:`
  struct U {pointer:vec2f,pad:vec2f};@group(0) @binding(0)var image:texture_2d<f32>;@group(0) @binding(1)var samp:sampler;@group(0) @binding(2)var<uniform> u:U;
  struct V{@builtin(position)p:vec4f,@location(0)uv:vec2f};
  @vertex fn vs(@builtin(vertex_index)i:u32)->V{var a=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));var o:V;o.p=vec4f(a[i],0,1);o.uv=a[i]*vec2f(.5,-.5)+.5;return o;}
  @fragment fn fs(v:V)->@location(0)vec4f{let uv=(v.uv-.5)*.975+.5+u.pointer*.009;let col=textureSample(image,samp,uv).rgb;let sheen=max(0.,1.-distance(v.uv,vec2f(.5)+u.pointer*.3)*1.4)*length(u.pointer)*.025;return vec4f(col+sheen,1.);}`});
  const p=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:shader,entryPoint:'vs'},fragment:{module:shader,entryPoint:'fs',targets:[{format}]},primitive:{topology:'triangle-list'}}),buffer=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const group=device.createBindGroup({layout:p.getBindGroupLayout(0),entries:[{binding:0,resource:texture.createView()},{binding:1,resource:device.createSampler({magFilter:'linear',minFilter:'linear'})},{binding:2,resource:{buffer}}]});
  function draw(){frame=0;if(!active||document.hidden)return;x+=(tx-x)*.15;y+=(ty-y)*.15;device.queue.writeBuffer(buffer,0,new Float32Array([x,y,0,0]));const e=device.createCommandEncoder(),pass=e.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),loadOp:'clear',storeOp:'store',clearValue:{r:0,g:0,b:0,a:1}}]});pass.setPipeline(p);pass.setBindGroup(0,group);pass.draw(3);pass.end();device.queue.submit([e.finish()]);if(Math.abs(x-tx)+Math.abs(y-ty)>.002)frame=requestAnimationFrame(draw)}
  function schedule(){if(!frame)frame=requestAnimationFrame(draw)}
  new ResizeObserver(()=>{const d=Math.min(devicePixelRatio||1,1.5);c.width=Math.max(1,Math.round(host.clientWidth*d));c.height=Math.max(1,Math.round(host.clientHeight*d));schedule()}).observe(host);
  host.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=host.getBoundingClientRect();tx=(e.clientX-r.left)/r.width*2-1;ty=(e.clientY-r.top)/r.height*2-1;schedule()});host.addEventListener('pointerleave',()=>{tx=ty=0;schedule()});document.addEventListener('visibilitychange',schedule);
  device.lost.then(()=>{active=false;c.classList.remove('ready');c.dataset.renderer='image-fallback'});c.dataset.renderer='webgpu-image';c.classList.add('ready');schedule();
 }catch(e){active=false;c.classList.remove('ready');c.dataset.renderer='image-fallback';if(device)device.destroy();}
})();
