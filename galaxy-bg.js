(function initGalaxy() {

  const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}`;

  const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;

varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071,-0.7071,0.7071,0.7071)
#define PERIOD 3.0

float Hash21(vec2 p){
  p=fract(p*vec2(123.34,456.21));
  p+=dot(p,p+45.32);
  return fract(p.x*p.y);
}
float tri(float x){ return abs(fract(x)*2.0-1.0); }
float tris(float x){ float t=fract(x); return 1.0-smoothstep(0.0,1.0,abs(2.0*t-1.0)); }
float trisn(float x){ float t=fract(x); return 2.0*(1.0-smoothstep(0.0,1.0,abs(2.0*t-1.0)))-1.0; }

vec3 hsv2rgb(vec3 c){
  vec4 K=vec4(1.0,2.0/3.0,1.0/3.0,3.0);
  vec3 p=abs(fract(c.xxx+K.xyz)*6.0-K.www);
  return c.z*mix(K.xxx,clamp(p-K.xxx,0.0,1.0),c.y);
}

float Star(vec2 uv,float flare){
  float d=length(uv);
  float m=(0.05*uGlowIntensity)/d;
  float rays=smoothstep(0.0,1.0,1.0-abs(uv.x*uv.y*1000.0));
  m+=rays*flare*uGlowIntensity;
  uv*=MAT45;
  rays=smoothstep(0.0,1.0,1.0-abs(uv.x*uv.y*1000.0));
  m+=rays*0.3*flare*uGlowIntensity;
  m*=smoothstep(1.0,0.2,d);
  return m;
}

vec3 StarLayer(vec2 uv){
  vec3 col=vec3(0.0);
  vec2 gv=fract(uv)-0.5;
  vec2 id=floor(uv);
  for(int y=-1;y<=1;y++){
    for(int x=-1;x<=1;x++){
      vec2 offset=vec2(float(x),float(y));
      vec2 si=id+vec2(float(x),float(y));
      float seed=Hash21(si);
      float size=fract(seed*345.32);
      float glossLocal=tri(uStarSpeed/(PERIOD*seed+1.0));
      float flareSize=smoothstep(0.9,1.0,size)*glossLocal;
      float red=smoothstep(STAR_COLOR_CUTOFF,1.0,Hash21(si+1.0))+STAR_COLOR_CUTOFF;
      float blu=smoothstep(STAR_COLOR_CUTOFF,1.0,Hash21(si+3.0))+STAR_COLOR_CUTOFF;
      float grn=min(red,blu)*seed;
      vec3 base=vec3(red,grn,blu);
      float hue=atan(base.g-base.r,base.b-base.r)/(2.0*3.14159)+0.5;
      hue=fract(hue+uHueShift/360.0);
      float sat=length(base-vec3(dot(base,vec3(0.299,0.587,0.114))))*uSaturation;
      float val=max(max(base.r,base.g),base.b);
      base=hsv2rgb(vec3(hue,sat,val));
      vec2 pad=vec2(tris(seed*34.0+uTime*uSpeed/10.0),tris(seed*38.0+uTime*uSpeed/30.0))-0.5;
      float star=Star(gv-offset-pad,flareSize);
      float twinkle=trisn(uTime*uSpeed+seed*6.2831)*0.5+1.0;
      twinkle=mix(1.0,twinkle,uTwinkleIntensity);
      star*=twinkle;
      col+=star*size*base;
    }
  }
  return col;
}

void main(){
  vec2 focalPx=uFocal*uResolution.xy;
  vec2 uv=(vUv*uResolution.xy-focalPx)/uResolution.y;
  vec2 mouseNorm=uMouse-vec2(0.5);
  if(uAutoCenterRepulsion>0.0){
    vec2 centerUV=vec2(0.0);
    float d=length(uv-centerUV);
    uv+=normalize(uv-centerUV)*(uAutoCenterRepulsion/(d+0.1))*0.05;
  } else if(uMouseRepulsion){
    vec2 mUV=(uMouse*uResolution.xy-focalPx)/uResolution.y;
    float d=length(uv-mUV);
    uv+=normalize(uv-mUV)*(uRepulsionStrength/(d+0.1))*0.05*uMouseActiveFactor;
  } else {
    uv+=mouseNorm*0.1*uMouseActiveFactor;
  }
  float a=uTime*uRotationSpeed;
  uv=mat2(cos(a),-sin(a),sin(a),cos(a))*uv;
  uv=mat2(uRotation.x,-uRotation.y,uRotation.y,uRotation.x)*uv;
  vec3 col=vec3(0.0);
  for(float i=0.0;i<1.0;i+=1.0/NUM_LAYER){
    float depth=fract(i+uStarSpeed*uSpeed);
    float scale=mix(20.0*uDensity,0.5*uDensity,depth);
    float fade=depth*smoothstep(1.0,0.9,depth);
    col+=StarLayer(uv*scale+i*453.32)*fade;
  }
  float alpha=length(col);
  alpha=smoothstep(0.0,0.3,alpha);
  alpha=min(alpha,1.0);
  gl_FragColor=vec4(col,alpha);
}`;

  /* ── setup ── */
  const ctn = document.createElement('div');
  ctn.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
  document.body.insertBefore(ctn, document.body.firstChild);

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  ctn.appendChild(canvas);

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
           || canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: false });
  if (!gl) return;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  /* ── shaders ── */
  function mkShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vertexShader));
  gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fragmentShader));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  /* ── full-screen triangle ── */
  function bindAttr(data, name, size) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, name);
    if (loc < 0) return;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }
  bindAttr(new Float32Array([-1,-1, 3,-1, -1,3]), 'position', 2);
  bindAttr(new Float32Array([ 0, 0, 2, 0,  0,2]), 'uv', 2);

  /* ── uniforms ── */
  const U = {};
  ['uTime','uResolution','uFocal','uRotation','uStarSpeed','uDensity','uHueShift',
   'uSpeed','uMouse','uGlowIntensity','uSaturation','uMouseRepulsion','uTwinkleIntensity',
   'uRotationSpeed','uRepulsionStrength','uMouseActiveFactor','uAutoCenterRepulsion'
  ].forEach(n => { U[n] = gl.getUniformLocation(prog, n); });

  const opts = {
    focal:[0.5,0.5], rotation:[1,0],
    starSpeed:0.5, density:1.1, hueShift:330, speed:0.8,
    glowIntensity:0.28, saturation:1.1,
    mouseRepulsion:true, repulsionStrength:1.8,
    twinkleIntensity:0.45, rotationSpeed:0.04, autoCenterRepulsion:0
  };

  function resize() {
    canvas.width  = ctn.offsetWidth;
    canvas.height = ctn.offsetHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform3f(U.uResolution, canvas.width, canvas.height, canvas.width / canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  gl.uniform2fv(U.uFocal,              opts.focal);
  gl.uniform2fv(U.uRotation,           opts.rotation);
  gl.uniform1f (U.uStarSpeed,          opts.starSpeed);
  gl.uniform1f (U.uDensity,            opts.density);
  gl.uniform1f (U.uHueShift,           opts.hueShift);
  gl.uniform1f (U.uSpeed,              opts.speed);
  gl.uniform2f (U.uMouse,              0.5, 0.5);
  gl.uniform1f (U.uGlowIntensity,      opts.glowIntensity);
  gl.uniform1f (U.uSaturation,         opts.saturation);
  gl.uniform1i (U.uMouseRepulsion,     opts.mouseRepulsion ? 1 : 0);
  gl.uniform1f (U.uTwinkleIntensity,   opts.twinkleIntensity);
  gl.uniform1f (U.uRotationSpeed,      opts.rotationSpeed);
  gl.uniform1f (U.uRepulsionStrength,  opts.repulsionStrength);
  gl.uniform1f (U.uMouseActiveFactor,  0);
  gl.uniform1f (U.uAutoCenterRepulsion,opts.autoCenterRepulsion);

  /* ── mouse ── */
  let tMouse = {x:.5,y:.5}, sMouse = {x:.5,y:.5}, tActive = 0, sActive = 0;
  document.addEventListener('mousemove', e => {
    tMouse.x = e.clientX / window.innerWidth;
    tMouse.y = 1 - e.clientY / window.innerHeight;
    tActive  = 1;
  });
  document.addEventListener('mouseleave', () => { tActive = 0; });

  /* ── loop ── */
  function update(t) {
    requestAnimationFrame(update);
    const k = 0.05;
    sMouse.x += (tMouse.x - sMouse.x) * k;
    sMouse.y += (tMouse.y - sMouse.y) * k;
    sActive  += (tActive  - sActive)  * k;

    gl.uniform1f(U.uTime,              t * 0.001);
    gl.uniform1f(U.uStarSpeed,        (t * 0.001 * opts.starSpeed) / 10);
    gl.uniform2f(U.uMouse,             sMouse.x, sMouse.y);
    gl.uniform1f(U.uMouseActiveFactor, sActive);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(update);

})();
