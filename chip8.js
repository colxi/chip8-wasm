var app = {};

document.addEventListener("DOMContentLoaded", function(event) {

    app = {
        status : 'running',
        config : {
            GUIRefreshIntervalRef : null,
            get GUIRefreshInterval(){ return 200 },
        },
        log : function(msg_ptr){
            let msg = '[wasm] ';
            let i=0;
            while(true){
                charCode = app.memory[msg_ptr+i];
                if(charCode === 0) break;
                let char = String.fromCharCode( charCode );
                msg += char;
                i++;
                if(i==100) break;
            }
            console.log(msg);
        },
        memorySize          : null,
        Pointer: {
            stack       : null,
            memory      : null,
            romImage    : null,
            Register    : {
                SP : null,
                PC : null,
                DT : null,
                ST : null,
                I  : null,
                V0 : null,
                V1 : null,
                V2 : null,
                V3 : null,
                V4 : null,
                V5 : null,
                V6 : null,
                V7 : null,
                V8 : null,
                V9 : null,
                VA : null,
                VB : null,
                VC : null,
                VD : null,
                VE : null,
                VF : null
            }
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
        GUIElements : {
            reg_SP : document.getElementById("reg_SP"),
            reg_PC : document.getElementById("reg_PC"),
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

            app.GUIElements.reg_V0.innerHTML = app.memory[app.Pointer.Register.V0];
            app.GUIElements.reg_V1.innerHTML = app.memory[app.Pointer.Register.V1];
            app.GUIElements.reg_V2.innerHTML = app.memory[app.Pointer.Register.V2];
            app.GUIElements.reg_V3.innerHTML = app.memory[app.Pointer.Register.V3];
            app.GUIElements.reg_V4.innerHTML = app.memory[app.Pointer.Register.V4];
            app.GUIElements.reg_V5.innerHTML = app.memory[app.Pointer.Register.V5];
            app.GUIElements.reg_V6.innerHTML = app.memory[app.Pointer.Register.V6];
            app.GUIElements.reg_V7.innerHTML = app.memory[app.Pointer.Register.V7];
            app.GUIElements.reg_V8.innerHTML = app.memory[app.Pointer.Register.V8];
            app.GUIElements.reg_V9.innerHTML = app.memory[app.Pointer.Register.V9];
            app.GUIElements.reg_VA.innerHTML = app.memory[app.Pointer.Register.VA];
            app.GUIElements.reg_VB.innerHTML = app.memory[app.Pointer.Register.VB];
            app.GUIElements.reg_VC.innerHTML = app.memory[app.Pointer.Register.VC];
            app.GUIElements.reg_VD.innerHTML = app.memory[app.Pointer.Register.VD];
            app.GUIElements.reg_VE.innerHTML = app.memory[app.Pointer.Register.VE];
            app.GUIElements.reg_VF.innerHTML = app.memory[app.Pointer.Register.VF];
            app.GUIElements.reg_SP.innerHTML = app.memory[app.Pointer.Register.SP];
            app.GUIElements.reg_PC.innerHTML = app.memory[app.Pointer.Register.PC+1]*256 + app.memory[app.Pointer.Register.PC];
            app.GUIElements.reg_DT.innerHTML = app.memory[app.Pointer.Register.DT];
            app.GUIElements.reg_ST.innerHTML = app.memory[app.Pointer.Register.ST];
            app.GUIElements.reg_I.innerHTML  = app.memory[app.Pointer.Register.I];

        },
        setpc: function(v){
            console.log(app.wasm._setStackPointer(v));
            console.log(  app.memory[app.Pointer.Register.PC] )
            console.log(  app.memory[app.Pointer.Register.PC+1] )
        },
        /**
         * [description]
         * @return {[type]} [description]
         */
        loadROM : async function(str){
            let result = await fetch('./rom/PONG');
            if(!result.ok) throw new Error('Unable to fetch ROM');
            let bytesROM        = new Uint8Array( await result.arrayBuffer() );
            let bytesROMLength  = bytesROM.byteLength;

            let baseOffset      = 0x200;
            // Check the length of the rom. Must be as much 3584 bytes long, which
            // is 4096 - 512. Since first 512 bytes of memory are reserved, program
            // code can only allocate up to 3584 bytes. Must check for bounds in
            // order to avoid buffer overflows.
            if( bytesROMLength > (app.memorySize - baseOffset) ){
                throw new Error('ROM image too big.');
            }
            // Everything is OK, read the ROM, and store it in Rom Memory
            for(let i=0; i<bytesROMLength; i++){
                app.memory[app.Pointer.romImage + i] = bytesROM[i];
            }
            app.wasm._loadRom();

            app.memoryDump();
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
            for(let i=0 ; i < app.memorySize; i++){
                // convert value to hex
                let hex = app.memory[app.Pointer.memory+i].toString(16)
                // force two chars hex representation (both nibbles)
                hex = (hex.length == 1) ? '0'+hex : hex;
                memory_DOM +=  hex +' ';
            };
            memory_output.innerHTML = memory_DOM;
        },
        step : function(){
            app.wasm._step();
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

            /*
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
            app.memory = new Uint8Array( memory.buffer );

            /*
                WASM Memory visualization :

                0    1024                16Mb
                |    |                   |
                --------------------------
                     |                   |
                     Heap->        <-Stack
            */
            /*
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
                    __console : function(msg_ptr){ app.log( msg_ptr ) }
                }
            });
            app.wasm = instance.exports;
            */

            app.memory = new Uint8Array( Module.wasmMemory.buffer );
            app.wasm = Module;
            app.wasm._init();
            app.memorySize       = app.wasm._getMemorySize();
            app.Pointer.memory   = app.wasm._getMemoryPointer();
            app.Pointer.romImage = app.wasm._getRomImagePointer();
            app.Pointer.stack    = app.wasm._getStackPointer();
            let registersBlockPointer= app.wasm._getRegistersBlockPointer();
            app.Pointer.Register.V0= registersBlockPointer;
            app.Pointer.Register.V1= registersBlockPointer+1;
            app.Pointer.Register.V2= registersBlockPointer+2;
            app.Pointer.Register.V3= registersBlockPointer+3;
            app.Pointer.Register.V4= registersBlockPointer+4;
            app.Pointer.Register.V5= registersBlockPointer+5;
            app.Pointer.Register.V6= registersBlockPointer+6;
            app.Pointer.Register.V7= registersBlockPointer+7;
            app.Pointer.Register.V8= registersBlockPointer+8;
            app.Pointer.Register.V9= registersBlockPointer+9;
            app.Pointer.Register.VA= registersBlockPointer+10;
            app.Pointer.Register.VB= registersBlockPointer+11;
            app.Pointer.Register.VC= registersBlockPointer+12;
            app.Pointer.Register.VD= registersBlockPointer+13;
            app.Pointer.Register.VE= registersBlockPointer+14;
            app.Pointer.Register.VF= registersBlockPointer+15;
            app.Pointer.Register.I = registersBlockPointer+16; // 2 bytes
            app.Pointer.Register.DT= registersBlockPointer+18;
            app.Pointer.Register.ST= registersBlockPointer+19;
            app.Pointer.Register.PC= registersBlockPointer+20; // 2 bytes
            app.Pointer.Register.SP= registersBlockPointer+22;


            app.memoryDump();
            const ps = new PerfectScrollbar( document.querySelectorAll("#groupInstructions [group-content]")[0] );
            //const ps = new PerfectScrollbar( document.querySelectorAll("#memory_output );
            app.config.GUIRefreshIntervalRef = setInterval( app.GUIRefresh, app.config.GUIRefreshInterval );
            return true;
        },
    };

    Module.asmLibraryArg.__console = app.log;
    Module.onRuntimeInitialized= app.init ;

    //a = new Worker('main.js')
});

var tick=function(){
a = performance.now();


}
