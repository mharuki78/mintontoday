import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readBookmarks } from '../lib/bookmarks.ts';
test('bookmark reader preserves old IDs and safely ignores corrupt storage and unsafe paths',()=>{
  assert.deepEqual(readBookmarks('{bad','null'),[]);
  assert.deepEqual(readBookmarks('{"foo":1}','[]'),[]);
  assert.deepEqual(readBookmarks('["lesson-grip-switching","lesson-grip-switching","../admin",4]','[{"id":"lesson-grip-switching","title":"그립 전환","category":"레슨"}]'),[{id:'lesson-grip-switching',title:'그립 전환',category:'레슨'}]);
  assert.deepEqual(readBookmarks('["old-save"]','bad'),[{id:'old-save'}]);
});
