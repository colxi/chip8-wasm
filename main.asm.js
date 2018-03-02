Module["asm"] = (function(global, env, buffer) {
 "almost asm";
 var HEAP8 = new global.Int8Array(buffer);
 var HEAP16 = new global.Int16Array(buffer);
 var STACKTOP = env.STACKTOP | 0;
 var STACK_MAX = env.STACK_MAX | 0;
 var tempRet0 = 0;
 var abortStackOverflow = env.abortStackOverflow;
 var __console = env.__console;
 function _console($0) {
  $0 = $0 | 0;
  var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, label = 0, sp = 0;
  sp = STACKTOP;
  STACKTOP = STACKTOP + 16 | 0;
  if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(16 | 0);
  $1 = $0;
  $2 = 0;
  while (1) {
   $3 = $1;
   $4 = $2;
   $5 = $3 + $4 | 0;
   $6 = HEAP8[$5 >> 0] | 0;
   $7 = $6 << 24 >> 24;
   $8 = ($7 | 0) == 0;
   $9 = $2;
   $10 = ($9 | 0) == 1024;
   $or$cond = $8 | $10;
   if ($or$cond) {
    break;
   }
   $13 = $1;
   $14 = $2;
   $15 = $13 + $14 | 0;
   $16 = HEAP8[$15 >> 0] | 0;
   $17 = $2;
   $18 = 352 + $17 | 0;
   HEAP8[$18 >> 0] = $16;
   $19 = $2;
   $20 = $19 + 1 | 0;
   $2 = $20;
  }
  $11 = $2;
  $12 = 352 + $11 | 0;
  HEAP8[$12 >> 0] = 0;
  __console(352 | 0);
  STACKTOP = sp;
  return;
 }
 function _memoryCopy($0, $1, $2) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, label = 0, sp = 0;
  sp = STACKTOP;
  STACKTOP = STACKTOP + 32 | 0;
  if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(32 | 0);
  $4 = $0;
  $5 = $1;
  $6 = $2;
  $9 = $4;
  $10 = ($9 | 0) != (0 | 0);
  $11 = $5;
  $12 = ($11 | 0) != (0 | 0);
  $or$cond = $10 & $12;
  if (!$or$cond) {
   $3 = 0;
   $23 = $3;
   STACKTOP = sp;
   return $23 | 0;
  }
  $13 = $5;
  $7 = $13;
  $14 = $4;
  $8 = $14;
  while (1) {
   $15 = $6;
   $16 = $15 + -1 | 0;
   $6 = $16;
   $17 = ($15 | 0) != 0;
   if (!$17) {
    break;
   }
   $18 = $7;
   $19 = $18 + 1 | 0;
   $7 = $19;
   $20 = HEAP8[$18 >> 0] | 0;
   $21 = $8;
   $22 = $21 + 1 | 0;
   $8 = $22;
   HEAP8[$21 >> 0] = $20;
  }
  $3 = 1;
  $23 = $3;
  STACKTOP = sp;
  return $23 | 0;
 }
 function _memoryFill($0, $1, $2) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
  sp = STACKTOP;
  STACKTOP = STACKTOP + 16 | 0;
  if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(16 | 0);
  $4 = $0;
  $5 = $1;
  $6 = $2;
  $8 = $4;
  $9 = ($8 | 0) != (0 | 0);
  if (!$9) {
   $3 = 0;
   $17 = $3;
   STACKTOP = sp;
   return $17 | 0;
  }
  $10 = $4;
  $7 = $10;
  while (1) {
   $11 = $6;
   $12 = $11 + -1 | 0;
   $6 = $12;
   $13 = ($11 | 0) != 0;
   if (!$13) {
    break;
   }
   $14 = $5;
   $15 = $7;
   $16 = $15 + 1 | 0;
   $7 = $16;
   HEAP8[$15 >> 0] = $14;
  }
  $3 = 1;
  $17 = $3;
  STACKTOP = sp;
  return $17 | 0;
 }
 function _getRegisterPointer() {
  var $0 = 0, label = 0, sp = 0;
  sp = STACKTOP;
  $0 = 296;
  tempRet0 = 0;
  return $0 | 0;
 }
 function _getRomImagePointer() {
  var $0 = 0, label = 0, sp = 0;
  sp = STACKTOP;
  $0 = 1376;
  tempRet0 = 0;
  return $0 | 0;
 }
 function _getMemoryPointer() {
  var $0 = 0, label = 0, sp = 0;
  sp = STACKTOP;
  $0 = 4960;
  tempRet0 = 0;
  return $0 | 0;
 }
 function _getMemorySize() {
  var label = 0, sp = 0;
  sp = STACKTOP;
  tempRet0 = 0;
  return 4096;
 }
 function _clearRegisters() {
  var label = 0, sp = 0;
  sp = STACKTOP;
  _console(88);
  _memoryFill(296, 0, 56) | 0;
  HEAP16[316 >> 1] = 512;
  return 1;
 }
 function _clearMemory() {
  var label = 0, sp = 0;
  sp = STACKTOP;
  _console(129);
  _memoryFill(4960, 0, 4096) | 0;
  _memoryCopy(4960, 8, 80) | 0;
  return 1;
 }
 function _loadRom() {
  var label = 0, sp = 0;
  sp = STACKTOP;
  _console(164);
  _clearRegisters() | 0;
  _clearMemory() | 0;
  _console(195);
  _memoryCopy(5472, 1376, 3584) | 0;
  _console(222);
  HEAP16[316 >> 1] = 512;
  HEAP8[318 >> 0] = 0;
  return 0;
 }
 function _init($0, $1) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  var $2 = 0, $3 = 0, label = 0, sp = 0;
  sp = STACKTOP;
  STACKTOP = STACKTOP + 16 | 0;
  if ((STACKTOP | 0) >= (STACK_MAX | 0)) abortStackOverflow(16 | 0);
  $2 = $0;
  $3 = $1;
  _console(281);
  STACKTOP = sp;
  return 1;
 }
 return {
  _getMemoryPointer: _getMemoryPointer,
  _getRomImagePointer: _getRomImagePointer,
  _init: _init,
  _getRegisterPointer: _getRegisterPointer,
  _loadRom: _loadRom,
  _getMemorySize: _getMemorySize
 };
});



