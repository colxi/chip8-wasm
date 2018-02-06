const Machine = {
    log : function(str){
        console.log(str);
    },
    /**
     * [memory description]
     * @type {[type]}
     */
    memory : null,
    /**
     * [wasm description]
     * @type {Object}
     */
    wasm : {},
    /**
     * [description]
     * @return {[type]} [description]
     */
    loadROM : async function(str){
        let result = await fetch('./rom/PONG');
        if(!result.ok) throw new Error('Unable to fetch ROM');
        let bytesROM        = new Uint8Array( await result.arrayBuffer() );
        let bytesROMLength  = bytesROM.byteLength;

        let memorySize      = Machine.wasm._getMemorySize();
        let memoryPointer   = Machine.wasm._getMemoryPointer();
        let baseOffset      = 0x200;
        // Check the length of the rom. Must be as much 3584 bytes long, which
    // is 4096 - 512. Since first 512 bytes of memory are reserved, program
    // code can only allocate up to 3584 bytes. Must check for bounds in
    // order to avoid buffer overflows.
        if( bytesROMLength > (memorySize - baseOffset) ){
            throw new Error('ROM image too big.');
        }
        // Everything is OK, read the ROM, and store it in Memory positionn 0x200
        for(let i=0; i<bytesROMLength; i++){
            Machine.memory[memoryPointer + baseOffset + i] = bytesROM[i];
        }
        return true;
    },
    /**
     * [memoryDump description]
     * @return {[type]} [description]
     */
    memoryDump : function(){
        let memory_output = document.getElementById('memory_output');
        let memSize = Machine.wasm._getMemorySize();
        let memPointer = Machine.wasm._getMemoryPointer();
        let memory_DOM = '';
        for(let i=0 ; i < memSize; i++){
            let hex = Machine.memory[memPointer+i].toString(16)
            hex = (hex.length == 1) ? '0'+hex : hex;
            memory_DOM +=  hex +' ';
        };
        memory_output.innerHTML = memory_DOM;
    },
    /**
     * [registersDump description]
     * @return {[type]} [description]
     */
    registersDump : function(){

    },
    /**
     * [description]
     * @return {[type]} [description]
     */
    init : async function(){
        // get the contents of main.wasm
        let result = await fetch('./main.wasm');
        if(!result.ok) throw new Error('Unable to fetch Web Assembly file main.wasm');
        // compile the bitcode
        let bytes   = await result.arrayBuffer();
        let module  = await WebAssembly.compile( bytes );
        // create a WebAssembly.Memory object that provides 256 pages of memory—each
        // page is 65k, so we're giving the code 16mb of total RAM.
        let memory  = new WebAssembly.Memory({initial: 256, maximum: 256});
        // expose the memory to the JS scope
        Machine.memory = new Uint8Array( memory.buffer );
        /*
            WASM Memory visualization :

            0    1024                16Mb
            |    |                   |
            --------------------------
                 |                   |
                 Heap->        <-Stack
        */
        let instance = await WebAssembly.instantiate( module, {
            env :  {
                table: new WebAssembly.Table({initial: 0, maximum: 0, element: 'anyfunc'}),
                tableBase : 0,
                // abortStackOverflow is called if Web Assembly runs out of stack space.
                abortStackOverflow : _ => { throw new Error('overflow'); },
                // memory property passes the WebAssembly.Memory object and specifies
                // where the heap should begin
                memory: memory,
                memoryBase: 1024,
                // TACK specifies where the stack should appear. It starts at STACK_MAX
                // and works upwards (i.e., towards zero)—so STACK_MAX starts at total
                // size of our memory, from memory.buffer.byteLength.
                STACKTOP: 0,
                STACK_MAX: memory.buffer.byteLength,
                __console : function(str){ console.log( str ) }
            }
        });
        Machine.wasm = instance.exports;

        Machine.wasm._init();
        Machine.memoryDump();
        return true;
    },
}
Machine.init();
