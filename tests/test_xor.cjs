"use strict";
const assert = require("node:assert/strict");
const { Net, RELAY } = require("../v27.js");

function beats(net, count, pulse) {
  const previous = Array(net.n).fill(true);
  const events = Array.from({length: net.n}, () => []);
  for (let t = 0; t < count; t++) {
    const own = net.step(null, pulse(t));
    for (let i = 0; i < net.n; i++) {
      const loud = own[i] > 3;
      if (loud && !previous[i]) events[i].push(t);
      previous[i] = loud;
    }
  }
  return events;
}
function one(a, b, lag=0, w=-4.5) {
  const net = new Net([RELAY, RELAY, RELAY], [[0,2,w,0],[1,2,w,0]]).settle(1500);
  return beats(net,40,t => new Float64Array([
    a && t < 2 ? -10 : 0,
    b && t >= lag && t < lag + 2 ? -10 : 0,
    0
  ]));
}
function ring({missed=[], extras=[], offset=0, weight=-4.5}={}) {
  const edges = Array.from({length:8},(_,i)=>[1+i,1+(i+1)%8,-6,0])
    .concat([[0,9,weight,0],[1,9,weight,0]]);
  const net = new Net(Array(10).fill(RELAY),edges).settle(1500);
  return beats(net,704,t => {
    const sp = new Float64Array(10);
    if(t<2)sp[1]=-10;
    if(t>=offset && (t-offset)%32<2 && !missed.includes(Math.floor(t/32)))sp[0]=-10;
    if(extras.some(k => t>=k && t<k+2))sp[0]=-10;
    return sp;
  });
}
const expected = {"00":[],"10":[8],"01":[8],"11":[]};
for(const key of Object.keys(expected)) {
  assert.deepEqual(one(key[0]==="1",key[1]==="1")[2],expected[key],key);
}
assert.deepEqual(one(true,true)[0],[4]);
assert.deepEqual(one(true,true)[1],[4]);
assert.notDeepEqual(one(true,true,1)[2],[]);
const normal=ring();
assert.deepEqual(normal[1].slice(0,4),[4,36,68,100]);
assert.deepEqual(normal[0].slice(0,4),[4,36,68,100]);
assert.deepEqual(normal[9],[]);
assert.deepEqual(ring({missed:[5]})[9],[168]);
assert.deepEqual(ring({missed:[5,10]})[9],[168,328]);
assert.deepEqual(ring({extras:[176]})[9],[184]);
console.log("GN-XOR native JavaScript checks passed (XOR, timing, ring replay, miss, extra)");
