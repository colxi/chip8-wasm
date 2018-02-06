emcc main.c -s WASM=1 -o main.js -s ONLY_MY_CODE=1 -s EXPORTED_FUNCTIONS="['_init', '_getMemoryPointer', '_getMemorySize','_clearRegisters','_clearMemory']"

