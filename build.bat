cls
REM set EMMCC_DEBUG=1
emcc main.c  ^
-s VERBOSE=1 ^
-s ASYNCIFY=1 ^
-s WASM=1 ^
-o main.js
