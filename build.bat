cls
emcc main.c  ^
-s VERBOSE=1 ^
-s WASM=1 ^
-o main.js  ^
-s EXPORTED_FUNCTIONS=^
"['_init', '_getMemoryPointer', '_getMemorySize','_getRomImagePointer', '_getRegisterPointer' ,'_loadRom']"
REM -s ONLY_MY_CODE=1
