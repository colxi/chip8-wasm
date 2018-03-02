const Machine = {
    status : 'running',
    config : {
        GUIRefreshIntervalRef : null,
        get GUIRefreshInterval(){ return 500 },
    },
    log : function(msg_ptr){
        let msg = '[wasm] ';
        let i=0;
        while(true){
            charCode = Machine.memory[msg_ptr+i];
            if(charCode === 0) break;
            let char = String.fromCharCode( charCode );
            msg += char;
            i++;
            if(i==100) break;
        }
        console.log(msg);
    },
    memoryPointer       : null,
    memorySize          : null,
    romImagePointer     : null,
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
    GUIElements : {
        reg_SP : document.getElementById("reg_SP"),
        reg_PC : document.getElementById("reg_SP"),
        reg_DT : document.getElementById("reg_DT"),
        reg_ST : document.getElementById("reg_ST"),
        reg_I  : document.getElementById("reg_I"),
        reg_V0 : document.getElementById("reg_V0"),
        reg_V1 : document.getElementById("reg_V1"),
        reg_V2 : document.getElementById("reg_V2"),
        reg_V3 : document.getElementById("reg_V3"),
        reg_V4 : document.getElementById("reg_V4"),
        reg_V5 : document.getElementById("reg_V5"),
        reg_V6 : document.getElementById("reg_V6"),
        reg_V7 : document.getElementById("reg_V7"),
        reg_V8 : document.getElementById("reg_V8"),
        reg_V9 : document.getElementById("reg_V9"),
        reg_VA : document.getElementById("reg_VA"),
        reg_VB : document.getElementById("reg_VB"),
        reg_VC : document.getElementById("reg_VC"),
        reg_VD : document.getElementById("reg_VD"),
        reg_VE : document.getElementById("reg_VE"),
        reg_VF : document.getElementById("reg_VF")
    },
    GUIRefresh : function(){

    },
    /**
     * [description]
     * @return {[type]} [description]
     */
    loadROM : async function(str){
        // todo: load rom into rom memory instead of machine memory
        // in wasm : loadRom should copy the rom into memory
        //
        //
        let result = await fetch('./rom/PONG');
        if(!result.ok) throw new Error('Unable to fetch ROM');
        let bytesROM        = new Uint8Array( await result.arrayBuffer() );
        let bytesROMLength  = bytesROM.byteLength;

        let baseOffset      = 0x200;
        // Check the length of the rom. Must be as much 3584 bytes long, which
        // is 4096 - 512. Since first 512 bytes of memory are reserved, program
        // code can only allocate up to 3584 bytes. Must check for bounds in
        // order to avoid buffer overflows.
        if( bytesROMLength > (Machine.memorySize - baseOffset) ){
            throw new Error('ROM image too big.');
        }
        // Everything is OK, read the ROM, and store it in Rom Memory
        for(let i=0; i<bytesROMLength; i++){
            Machine.memory[Machine.romImagePointer + i] = bytesROM[i];
        }
        Machine.wasm._loadRom();

        Machine.memoryDump();
        return true;
    },
    /**
     * [memoryDump description]
     * @return {[type]} [description]
     */
    memoryDump : function(){
        console.log("Memory Dumping...");
        let memory_output = document.getElementById('memory_output');
        let memory_DOM = '';
        for(let i=0 ; i < Machine.memorySize; i++){
            // convert value to hex
            let hex = Machine.memory[Machine.memoryPointer+i].toString(16)
            // force two chars hex representation (both nibbles)
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
                __console : function(msg_ptr){ Machine.log( msg_ptr ) }
            }
        });
        Machine.wasm = instance.exports;

        Machine.wasm._init();

        Machine.memorySize      = Machine.wasm._getMemorySize();
        Machine.memoryPointer   = Machine.wasm._getMemoryPointer();
        Machine.romImagePointer = Machine.wasm._getRomImagePointer();

        Machine.memoryDump();
        const ps = new PerfectScrollbar( document.querySelectorAll("#groupInstructions [group-content]")[0] );
        //const ps = new PerfectScrollbar( document.querySelectorAll("#memory_output );
        return true;
    },
}
Machine.init();

