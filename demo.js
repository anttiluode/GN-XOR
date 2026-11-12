/* Offline GN-XOR browser laboratory. The only truth table is observed events. */
"use strict";
(() => {
  const {Net, RELAY} = globalThis.GN27;
  const $ = id => document.getElementById(id);
  const colors = {A:"#63c6ff",B:"#ffc37a",C:"#ff7dab",ring:"#76dec1",muted:"#8da8bf"};
  const state = {mode:"omit",tick:168,playing:false,weight:-4.5,lag:0,ringEvents:[],clock:null};

  function observe(net, ticks, pulse) {
    const previous = Array(net.n).fill(true);
    const events = Array.from({length:net.n},()=>[]);
    for(let t=0;t<ticks;t++) {
      const readings=net.step(null,pulse(t));
      for(let i=0;i<net.n;i++) {
        const loud=readings[i]>3;
        if(loud&&!previous[i])events[i].push(t);
        previous[i]=loud;
      }
    }
    return events;
  }
  function xorCase(a,b,lag=0,w=-4.5) {
    const net=new Net([RELAY,RELAY,RELAY],[[0,2,w,0],[1,2,w,0]]).settle(1500);
    return observe(net,40,t=>new Float64Array([
      a&&t<2?-10:0, b&&t>=lag&&t<lag+2?-10:0, 0
    ]));
  }
  function ringCase(mode,w=-4.5) {
    const edges=Array.from({length:8},(_,i)=>[i+1,(i+1)%8+1,-6,0])
      .concat([[0,9,w,0],[1,9,w,0]]);
    const net=new Net(Array(10).fill(RELAY),edges).settle(1500);
    return observe(net,416,t=>{
      const sp=new Float64Array(10);
      if(t<2)sp[1]=-10; // one native seed; never repeated
      const offset=mode==="offset"?1:0;
      if(t>=offset&&(t-offset)%32<2 && !(mode==="omit"&&Math.floor(t/32)===5))sp[0]=-10;
      if(mode==="extra"&&t>=176&&t<178)sp[0]=-10;
      return sp;
    });
  }
  function formatEvents(ev) {
    return ev.length? ev.join(", ") : "none";
  }
  function drawLanes(canvas,laneDefs,maxT,marker=null) {
    const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
    ctx.clearRect(0,0,w,h);ctx.fillStyle="#0b1627";ctx.fillRect(0,0,w,h);
    const left=107,right=w-18, plot=right-left;
    const x=t=>left+t/maxT*plot;
    const lastY=laneDefs.length?42+(laneDefs.length-1)*46:42;
    ctx.lineWidth=1;ctx.font="12px system-ui";
    const gap=maxT>100?32:4;
    for(let t=0;t<=maxT;t+=gap){
      const px=x(t);ctx.strokeStyle="#22344a";ctx.beginPath();ctx.moveTo(px,12);ctx.lineTo(px,lastY+19);ctx.stroke();
      ctx.fillStyle="#7492a9";ctx.fillText(String(t),px-7,lastY+41);
    }
    laneDefs.forEach((lane,i)=>{
      const y=36+i*46;
      ctx.fillStyle="#b6c9df";ctx.fillText(lane.label,10,y+4);
      ctx.strokeStyle="#37516b";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
      for(const t of lane.events) {
        const px=x(t);ctx.strokeStyle=lane.color;ctx.fillStyle=lane.color;ctx.lineWidth=3;
        ctx.beginPath();ctx.moveTo(px,y);ctx.lineTo(px,y-22);ctx.stroke();
        ctx.beginPath();ctx.arc(px,y-22,3.7,0,2*Math.PI);ctx.fill();
      }
    });
    if(marker!==null){
      const px=x(marker);ctx.strokeStyle="#eef7ff";ctx.lineWidth=1.4;
      ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(px,9);ctx.lineTo(px,lastY+19);ctx.stroke();ctx.setLineDash([]);
    }
  }
  function renderXor() {
    const a=$("sourceA").checked,b=$("sourceB").checked,lag=+$("lag").value,w=+$("weight").value;
    state.weight=w;state.lag=lag;
    $("lagLabel").textContent=lag+" tick"+(lag===1?"":"s");
    $("weightLabel").textContent=w.toFixed(2).replace("-","−");
    const truth=$("truth");
    truth.replaceChildren();
    for(const [aa,bb] of [[false,false],[true,false],[false,true],[true,true]]) {
      const ev=xorCase(aa,bb,0,w);
      const tr=document.createElement("tr");
      if(aa===a && bb===b)tr.className="selected";
      for(const value of [aa?"1":"0",bb?"1":"0",ev[2].length?"BEAT @ "+formatEvents(ev[2]):"silent"]) {
        const td=document.createElement("td");td.textContent=value;tr.append(td);
      }
      truth.append(tr);
    }
    const ev=xorCase(a,b,lag,w);
    $("singleStatus").textContent=ev[2].length?("tick "+ev[2][0]):"silent";
    drawLanes($("xorTimeline"),[
      {label:"World A",events:ev[0],color:colors.A},
      {label:"Predict B",events:ev[1],color:colors.B},
      {label:"Receiver",events:ev[2],color:colors.C}
    ],40);
  }
  function renderOrbit() {
    const c=$("orbit"),ctx=c.getContext("2d"),w=c.width,h=c.height,cx=w/2,cy=h/2,r=133;
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle="#43647f";ctx.lineWidth=12;
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#d2e6f5";ctx.font="bold 16px system-ui";
    ctx.fillText("NATIVE RELAY RING",cx,cy-10);
    ctx.fillStyle="#8ba9bc";ctx.font="13px system-ui";ctx.fillText("32 ticks / lap",cx,cy+15);
    for(let i=0;i<8;i++) {
      const theta=i*Math.PI/4-Math.PI/2,x=cx+r*Math.cos(theta),y=cy+r*Math.sin(theta);
      const spike=state.ringEvents[i+1]?.some(t=>Math.abs(t-state.tick)<=1);
      ctx.fillStyle=spike?"#f7cf8c":"#2c786f";
      ctx.strokeStyle=spike?"#fff8dd":"#8ee1d4";
      ctx.lineWidth=spike?3.5:1.5;
      ctx.beginPath();ctx.arc(x,y,spike?21:16,0,2*Math.PI);ctx.fill();ctx.stroke();
      ctx.fillStyle=spike?"#17212e":"#e7fffa";ctx.font="bold 13px system-ui";ctx.fillText(i+1,x,y+1);
    }
    ctx.textAlign="start";ctx.textBaseline="alphabetic";
    const flash=(events,t)=>events.some(e=>Math.abs(t-e)<=1);
    for(const [x,y,text,ev,color] of [[20,350,"WORLD",state.ringEvents[0]||[],colors.A],[265,350,"ERROR",state.ringEvents[9]||[],colors.C]]) {
      ctx.fillStyle=flash(ev,state.tick)?color:"#47627a";
      ctx.beginPath();ctx.arc(x+9,y-7,8,0,2*Math.PI);ctx.fill();
      ctx.fillStyle="#bad2e2";ctx.font="12px system-ui";ctx.fillText(text,x+24,y-3);
    }
  }
  function redrawRing() {
    state.ringEvents=ringCase(state.mode,state.weight);
    const world=state.ringEvents[0],pred=state.ringEvents[1],error=state.ringEvents[9];
    $("ringErrors").textContent=String(error.length);
    $("ringFirst").textContent=error.length?"t = "+error[0]:"none";
    $("ringPred").textContent=String(pred.length);
    const descriptions={
      match:"World pulses coincide with the ring's replay. The native receiver remains quiet.",
      omit:"One expected world event is absent in lap 5. The ring continues, and the native receiver produces an error beat.",
      extra:"The world emits an unexpected pulse at tick 176. The ring did not predict it, so the receiver beats.",
      offset:"The world rhythm is one tick late. Phase mismatch exposes the narrow timing window in this circuit."
    };
    $("description").textContent=descriptions[state.mode] + " Error ticks: "+formatEvents(error)+".";
    drawRingTimeline();
  }
  function drawRingTimeline() {
    drawLanes($("ringTimeline"),[
      {label:"World",events:state.ringEvents[0]||[],color:colors.A},
      {label:"Ring",events:state.ringEvents[1]||[],color:colors.B},
      {label:"Mismatch",events:state.ringEvents[9]||[],color:colors.C}
    ],416,state.tick);
    $("tickLabel").textContent=state.tick+" / 416";
    $("scrub").value=state.tick;
    renderOrbit();
  }
  function stop() {state.playing=false;clearInterval(state.clock);state.clock=null;$("play").textContent="▶ Play";}
  $("sourceA").addEventListener("change",renderXor);
  $("sourceB").addEventListener("change",renderXor);
  $("lag").addEventListener("input",renderXor);
  $("weight").addEventListener("change",()=>{renderXor();redrawRing();});
  $("weight").addEventListener("input",()=>{$("weightLabel").textContent=(+$("weight").value).toFixed(2).replace("-","−");});
  $("modes").querySelectorAll("button").forEach(button=>button.addEventListener("click",()=>{
    stop();state.mode=button.dataset.mode;
    $("modes").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b===button));
    state.tick=state.mode==="extra"?184:168;
    redrawRing();
  }));
  $("scrub").addEventListener("input",()=>{state.tick=+$("scrub").value;drawRingTimeline()});
  $("play").addEventListener("click",()=>{
    if(state.playing){stop();return;}
    state.playing=true;$("play").textContent="❚❚ Pause";
    state.clock=setInterval(()=>{state.tick=(state.tick+1)%416;drawRingTimeline();},65);
  });
  $("reset").addEventListener("click",()=>{stop();state.tick=0;drawRingTimeline();});
  renderXor();
  redrawRing();
})();
