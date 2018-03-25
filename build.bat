cls
REM emsdk activate --latest
REM set EMMCC_DEBUG=1
emcc src/chip8.c  ^
-s VERBOSE=1 ^
-s ASYNCIFY=1 ^
-s WASM=1 ^
-o src/chip8.js
