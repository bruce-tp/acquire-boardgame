import test from 'node:test';
import assert from 'node:assert/strict';
import {createTurnReminder} from '../lib/turn-reminder.ts';

test('buy-phase reminder waits twenty seconds and rings once per idle period',t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  let rings=0;
  const reminder=createTurnReminder(()=>rings++);
  t.after(reminder.stop);
  t.mock.timers.tick(19_999);
  assert.equal(rings,0);
  t.mock.timers.tick(1);
  assert.equal(rings,1);
  t.mock.timers.tick(60_000);
  assert.equal(rings,1);
});

test('player input postpones the reminder; leaving the phase cancels it',t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  let rings=0;
  const reminder=createTurnReminder(()=>rings++);
  t.after(reminder.stop);
  t.mock.timers.tick(15_000);
  reminder.activity();
  t.mock.timers.tick(19_999);
  assert.equal(rings,0);
  t.mock.timers.tick(1);
  assert.equal(rings,1);
  reminder.activity();
  t.mock.timers.tick(10_000);
  reminder.stop();
  reminder.activity();
  t.mock.timers.tick(60_000);
  assert.equal(rings,1);
});
