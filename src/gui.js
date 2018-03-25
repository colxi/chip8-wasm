'use strict';

var app = {};
    let __CANVAS_DATA__ = null;
    let __WASM_MEMORY__ = null;

document.addEventListener('DOMContentLoaded', function() {
    /* PRIVATE VARIABLES */
    let __GUI_REFRESH_INTERVAL__= 200;
    let __REGISTERS_OFFSET__ = null;
    let __EMULATOR_STATUS__ = null;

    /* PUBLIC OBJECT */
    app = {
        get Status(){ return __EMULATOR_STATUS__[0] },
        set Status( value ){ throw Error('app.Status cannot be setted diectly. Use any of the app.Emulator methods instead.') },
        Memory  : null,
        Stack   : null,
        Register : {
            // Genral purpose registers...
            // V[0-F] registers have all them a single byte value
            // V0
            get V0(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__] },
            set V0(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__] = v },
            // V1
            get V1(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+1] },
            set V1(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+1] = v },
            // V2
            get V2(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+2] },
            set V2(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+2] = v },
            // V3
            get V3(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+3] },
            set V3(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+3] = v },
            // V4
            get V4(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+4] },
            set V4(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+4] = v },
            // V5
            get V5(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+5] },
            set V5(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+5] = v },
            // V6
            get V6(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+6] },
            set V6(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+6] = v },
            // V7
            get V7(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+7] },
            set V7(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+7] = v },
            // V8
            get V8(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+8] },
            set V8(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+8] = v },
            // V9
            get V9(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+9] },
            set V9(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+9] = v },
            // VA
            get VA(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+10] },
            set VA(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+10] = v },
            // VB
            get VB(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+11] },
            set VB(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+11] = v },
            // VC
            get VC(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+12] },
            set VC(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+12] = v },
            // VD
            get VD(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+13] },
            set VD(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+13] = v },
            // VE
            get VE(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+14] },
            set VE(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+14] = v },
            // VF
            get VF(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+15] },
            set VF(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+15] = v },
            // I register is stored as a 2 byte litle-endian value.
            // ( In the original CHIP8 this value was stored using big endian )
            get I(){
                return __WASM_MEMORY__[__REGISTERS_OFFSET__+17]*256 + __WASM_MEMORY__[__REGISTERS_OFFSET__+16];
            },
            set I(v){
                __WASM_MEMORY__[__REGISTERS_OFFSET__+17] = (v & 0xFF00) >> 8;
                __WASM_MEMORY__[__REGISTERS_OFFSET__+16] = v & 0x00FF;
            },
            // DT Delay Timer has a single byte value
            get DT(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+18] },
            set DT(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+18] = v },
            // ST Sound Timer has a single byte value
            get ST(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+19] },
            set ST(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+19] = v },
            // PC Program Counter is stored as a 2 byte litle-endian value
            // ( In the original CHIP8 this value was stored using big endian )
            get PC(){
                return __WASM_MEMORY__[__REGISTERS_OFFSET__+21]*256 + __WASM_MEMORY__[__REGISTERS_OFFSET__+20];
            },
            set PC(v){
                __WASM_MEMORY__[__REGISTERS_OFFSET__+20] = v & 0x00FF;
                __WASM_MEMORY__[__REGISTERS_OFFSET__+21] = (v & 0xFF00) >> 8;
            },
            // SP Stack Pointer is a single byte value
            get SP(){  return __WASM_MEMORY__[__REGISTERS_OFFSET__+22] },
            set SP(v){ __WASM_MEMORY__[__REGISTERS_OFFSET__+22] = v }
        },
        ROM     : null,

        Watchers : [],
        /**
         * app.Config{} : Container Object for storing the collection of
         * the emulator application GUI settings
         * @type {Object}
         */
        Config : {
            // TODO : make GUIRefreshIntervalRef private and renamme
            // to __GUI_REFRESH_INTERVAL_REF__
            GUIRefreshIntervalRef : null,
            // haltOnError(boolean) will make the emulation halt when any error
            // is found, like an invalid o unimpemented INSTRUCTION
            get haltOnError(){ app.wasm._getHaltOnError() },
            set haltOnError( value ){
                if( value !=1 && value !=0 ) throw Error('app.haltOnError (setter) : Invalid argument. Boolean expected.');
                app.wasm._setHaltOnError(value);
            },
            // GUIRefreshInterval(miliseconds) sets how often will the GUI refresh
            // lower valus, could break browser responsiveness
            get GUIRefreshInterval(){ return __GUI_REFRESH_INTERVAL__ },
            set GUIRefreshInterval( ms ){
                if( !Number.isInteger(ms) || ms < 0 ) throw Error('app.GUIRefreshInterval (setter) : Invalid argument. Positive Integer number expected.');
                __GUI_REFRESH_INTERVAL__ = ms;
                // If GUIRefresh routine is currently running, disable it, set new
                // clock internal value and restart it
                if(app.Config.GUIRefreshIntervalRef !== null){
                    clearInterval(app.Config.GUIRefreshIntervalRef);
                    app.Config.GUIRefreshIntervalRef = setInterval( app.GUIRefresh, ms );
                }
            },
            // instructionsAutoscroll(boolean) define if instruction contiainer
            // will be autoscrolled on GUI Refreah
            instructionsAutoscroll : true,
            //
            get colorizedMemorDump(){},
            set colorizedMemorDump(value){},
        },
        /**
         * [wasm description]
         * @type {Object}
         */
        wasm : {},
        /**
         * app.GUI{} : cached collection of DOM Elements frequentlly required.
         * Used to boost GUI refresh routine execution times, mainly, but not
         * exclusivelly.
         */
        GUI   : {
            instructionsContainer : document.querySelectorAll('#groupInstructions [group-content]')[0],
            currentIntructionRow  : null,
            display   : document.getElementById('display'),
            reg_SP   : document.getElementById('reg_SP'),
            reg_PC   : document.getElementById('reg_PC'),
            reg_DT   : document.getElementById('reg_DT'),
            reg_ST   : document.getElementById('reg_ST'),
            reg_I    : document.getElementById('reg_I'),
            reg_V0   : document.getElementById('reg_V0'),
            reg_V1   : document.getElementById('reg_V1'),
            reg_V2   : document.getElementById('reg_V2'),
            reg_V3   : document.getElementById('reg_V3'),
            reg_V4   : document.getElementById('reg_V4'),
            reg_V5   : document.getElementById('reg_V5'),
            reg_V6   : document.getElementById('reg_V6'),
            reg_V7   : document.getElementById('reg_V7'),
            reg_V8   : document.getElementById('reg_V8'),
            reg_V9   : document.getElementById('reg_V9'),
            reg_VA   : document.getElementById('reg_VA'),
            reg_VB   : document.getElementById('reg_VB'),
            reg_VC   : document.getElementById('reg_VC'),
            reg_VD   : document.getElementById('reg_VD'),
            reg_VE   : document.getElementById('reg_VE'),
            reg_VF   : document.getElementById('reg_VF'),
            stack_00 : document.getElementById('stack_00'),
            stack_01 : document.getElementById('stack_01'),
            stack_02 : document.getElementById('stack_02'),
            stack_03 : document.getElementById('stack_03'),
            stack_04 : document.getElementById('stack_04'),
            stack_05 : document.getElementById('stack_05'),
            stack_06 : document.getElementById('stack_06'),
            stack_07 : document.getElementById('stack_07'),
            stack_08 : document.getElementById('stack_08'),
            stack_09 : document.getElementById('stack_09'),
            stack_0A : document.getElementById('stack_0A'),
            stack_0B : document.getElementById('stack_0B'),
            stack_0C : document.getElementById('stack_0C'),
            stack_0D : document.getElementById('stack_0D'),
            stack_0E : document.getElementById('stack_0E'),
            stack_0F : document.getElementById('stack_0F'),
        },
        ScreenRefresh(){
            app.GUI.imageData.data.set(__CANVAS_DATA__);
            app.GUI.ctx.putImageData(app.GUI.imageData, 0, 0);

            requestAnimationFrame(app.ScreenRefresh);
        },
        /**
         * [GUIRefresh description]
         */
        GUIRefresh : function(){
            return;
            // *** REGISTERS
            // Update Registers view
            app.GUI.reg_V0.innerHTML = app.toHex( app.Register.V0, 1 );
            app.GUI.reg_V1.innerHTML = app.toHex( app.Register.V1, 1 );
            app.GUI.reg_V2.innerHTML = app.toHex( app.Register.V2, 1 );
            app.GUI.reg_V3.innerHTML = app.toHex( app.Register.V3, 1 );
            app.GUI.reg_V4.innerHTML = app.toHex( app.Register.V4, 1 );
            app.GUI.reg_V5.innerHTML = app.toHex( app.Register.V5, 1 );
            app.GUI.reg_V6.innerHTML = app.toHex( app.Register.V6, 1 );
            app.GUI.reg_V7.innerHTML = app.toHex( app.Register.V7, 1 );
            app.GUI.reg_V8.innerHTML = app.toHex( app.Register.V8, 1 );
            app.GUI.reg_V9.innerHTML = app.toHex( app.Register.V9, 1 );
            app.GUI.reg_VA.innerHTML = app.toHex( app.Register.VA, 1 );
            app.GUI.reg_VB.innerHTML = app.toHex( app.Register.VB, 1 );
            app.GUI.reg_VC.innerHTML = app.toHex( app.Register.VC, 1 );
            app.GUI.reg_VD.innerHTML = app.toHex( app.Register.VD, 1 );
            app.GUI.reg_VE.innerHTML = app.toHex( app.Register.VE, 1 );
            app.GUI.reg_VF.innerHTML = app.toHex( app.Register.VF, 1 );
            app.GUI.reg_SP.innerHTML = app.toHex( app.Register.SP, 1 );
            app.GUI.reg_PC.innerHTML = app.toHex( app.Register.PC, 2 );
            app.GUI.reg_DT.innerHTML = app.toHex( app.Register.DT, 1 );
            app.GUI.reg_ST.innerHTML = app.toHex( app.Register.ST, 1 );
            app.GUI.reg_I.innerHTML  = app.toHex( app.Register.I , 2 );
            // *** INSTRUCTIONS
            // Set current instruction ( unset first the instruction setted
            // in the previous GUI refresh )
            if(app.GUI.currentIntructionRow) app.GUI.currentIntructionRow.removeAttribute('current');
            app.GUI.currentIntructionRow = document.getElementById( 'instruction_' + app.toHex( app.Register.PC , 2) );
            app.GUI.currentIntructionRow.setAttribute('current',true);
            // set scroll to current instruction elemen
            app.GUI.instructionsContainer.scrollTop = app.GUI.currentIntructionRow.offsetTop - 150;
            // *** STACK
            // Refresh the Stack view, iterate over the 16 stack levels, to
            // set/remove the appropiate attributes
            for(let i=0; i<16;i++){
                let current = app.GUI['stack_'+ app.toHex(i,1)];
                current.removeAttribute('disabled');
                current.removeAttribute('current');
                if(i>app.Register.SP) current.setAttribute('disabled',true);
                if(i==app.Register.SP) current.setAttribute('current',true);
                current.innerHTML=  app.toHex( app.Stack[ i*2 ] , 1) + app.toHex( app.Stack[ (i*2)+1 ] , 1 );
            }
            // smartGUIRefreshRate
        },
        /**
         * [description]
         * @return {[type]} [description]
         */
        loadROM : async function(){
            let file = document.getElementById('romFile').selectedOptions[0].innerText

            let result = await fetch('../rom/'+file);
            if(!result.ok) throw new Error('Unable to fetch ROM');
            let bytesROM        = new Uint8Array( await result.arrayBuffer() );

            // Check the length of the rom. Must be as much 3584 bytes long, which
            // is 4096 - 512. Since first 512 bytes of memory are reserved, program
            // code cneeds to fit in 3584 bytes. Must check for bounds in
            // order to avoid buffer overflows.
            if( bytesROM.byteLength > (app.Memory.length - 0x0200) ){
                throw new Error('ROM image too big.');
            }
            // Everything is OK, read the ROM, and store it in Rom Memory
            for(let i=0; i<bytesROM.byteLength; i++) app.ROM[i] = bytesROM[i];

            app.emulationInit();
            return true;
        },
        /**
         * [memoryDump description]
         * @return {[type]} [description]
         */
        memoryDump : function(){
            let init_time = performance.now();
            console.log('Memory Dumping...');
            let memory_output = document.getElementById('memory_output');
            let memory_DOM = '';
            let instructions_DOM  = '';
            for(let i=0 ; i < app.Memory.length; i++){
                // convert value to hex
                let hex = app.toHex( app.Memory[i], 1 );
                hex = '<span id="byte_'+ app.toHex(i,2) +'">'+ hex + '</span>';
                memory_DOM +=  hex +' ';

                if( i%2==0 && i>=0x0200) instructions_DOM += app.disasemble( i );
            }
            memory_output.innerHTML = memory_DOM;
            app.GUI.instructionsContainer.innerHTML=instructions_DOM;
            app.GUI.currentIntructionRow = null;
            app.GUIRefresh();

            console.log('dumping done');
            console.log('Memory dump done. Elapsed time: ' , performance.now() - init_time);
        },
        toHex: function( v, bytecast=0, prefix=false, spaced=false ){
            let hex = v.toString(16).toUpperCase();
            // if cast is requested, calculate padding and add it
            // todo: check if value can be reprsented in requested length
            if(bytecast != 0) hex = '0'.repeat( (bytecast*2) - hex.length ) + hex;
            // if requested, add spacing betwen each byte
            // todo: use spaced var value as spacing character(s)
            if(spaced && hex.length>2) hex = hex.split(/(?=(?:..)*$)/).join(' ');
            // add prefix when requested
            if(prefix) hex= prefix+hex;
            return hex;
        },
        setBreakpoint: function(){},
        setPC: function(value){
            app.Register.PC = value;
            app.emulationPause();
        },
        setOpcode(i){
            let a = window.prompt();
            let b = a.split(/(?=(?:..)*$)/);
            app.Memory[i]=Number('0x'+b[0]);
            app.Memory[i+1]=Number('0x'+b[1]);
        },
        setRegistry: function(r) {
            let a = window.prompt();
            app.Register[r] = Number('0x'+a);

        },


        disasemble :function(i){
            // x- --
            let OC    = app.Memory[i] >> 4;
            // -x --
            let X     = app.Memory[i] & 0x0F;
            // -- x-
            let Y     = app.Memory[i+1] >> 4;
            // -- -x
            let Z     = app.Memory[i+1] & 0x0F;
            // xx --
            let JJ    = app.Memory[i];
            // -- xx
            let KK    = app.Memory[i+1];
            // -x xx
            let NNN   = ( (app.Memory[i] & 0x0F) << 8 ) | app.Memory[i+1];
            let row =  `
                <div id="instruction_${app.toHex(i,2)}" class="row"  __BREAKPOINT__>
                    <span class="info">
                        <span class="breakpoint" onclick="app.setBreakpoint()">⚑</span>
                        <span class="current" onclick="app.setPC(${i})">➤</span>
                    </span>
                    <span class="offset">__OFFSET__</span>
                    <span class="opcode" onclick="app.setOpcode(${i})">__OPCODE__</span>
                    <span class="nemonic">__ASM__</span>
                </div>
            `;
            row = row.replace('__OFFSET__', app.toHex(i,2) );
            row = row.replace('__OPCODE__', app.toHex(JJ,1) + ' ' + app.toHex(KK,1) );
            /*

            */
            switch(OC){
                case 0x0:
                    // 00E0 Clear the screen
                    if(KK == 0xE0) row = row.replace( '__ASM__', 'CLR' );
                    // 00EE Return from a CHIP-8 sub-routine
                    else if(KK == 0xEE){
                        row = row.replace( '__ASM__', 'RTS' );
                        row = row.replace( '__RETURN__', 'return' );
                    }
                    // unkmown opcde
                    else{ /* ... */ }
                    break;
                case 0x1:
                    // jumo to NNN
                    row = row.replace( '__ASM__', 'JUMP' +' '+ app.toHex(NNN,2,'0x') );
                    break;
                case 0x2:
                    // Call CHIP-8 sub-routine at NNN (16 successive calls max)
                    row = row.replace( '__ASM__', 'CALL' +' '+ app.toHex(NNN,2,'0x') );
                    break;
                case 0x3:
                    // 3XKK = Skip next instruction if VX == KK
                    row = row.replace( '__ASM__', 'SKEQ' +' V'+app.toHex(X)+' , '+ app.toHex(KK,1,'0x') );
                    break;
                case 0x4:
                    // 4XKK Skip next instruction if VX != KK
                    row = row.replace( '__ASM__', 'SKNE' +' V'+app.toHex(X)+' , '+ app.toHex(KK,1,'0x') );
                    break;
                case 0x5:
                    // 5XY0 Skip next instruction if VX == VY
                    row = row.replace( '__ASM__', 'SKEQ' +' V'+app.toHex(X)+' , V'+app.toHex(Y) );
                    break;
                case 0x6:
                    // 6XKK VX = KK
                    row = row.replace( '__ASM__', 'MOV' +' V'+app.toHex(X)+' , '+ app.toHex(KK,1,'0x') );
                    break;
                case 0x7:
                    // 7XKK VX = VX + KK
                    row = row.replace( '__ASM__', 'ADD' +' V'+app.toHex(X)+' , '+ app.toHex(KK,1,'0x') );
                    break;
                case 0x8:
                    // 8XY0 VX = VY
                    if(Z==0) row = row.replace( '__ASM__', 'MOV' +' V'+app.toHex(X)+' , V'+app.toHex(Y) );
                    // 8XY1 VX = VX OR VY
                    else if(Z==1) row = row.replace( '__ASM__', 'OR' +' V'+app.toHex(X)+' , V'+app.toHex(Y) );
                    // 8XY2 VX = VX AND VY
                    else if(Z==2) row = row.replace( '__ASM__', 'AND' +' V'+app.toHex(X)+' , V'+app.toHex(Y) );
                    // 8XY3 VX = VX XOR VY
                    else if(Z==3) row = row.replace( '__ASM__', 'XOR' +' V'+app.toHex(X)+' , V'+app.toHex(Y) );
                    // 8XY4 VX = VX + VY, VF = carry
                    else if(Z==4) row = row.replace( '__ASM__', 'ADD' +' V'+app.toHex(X)+' , V'+app.toHex(Y) );
                    // 8XY5 VX = VX - VY, VF = not borrow
                    else if(Z==5) row = row.replace( '__ASM__', 'SUB' +' V'+app.toHex(X)+' , V'+app.toHex(Y) );
                    // 8X06 VX = VX shift right 1 bit (VX=VX/2), VF = carry (bit 0)
                    else if(Z==6) row = row.replace( '__ASM__', 'SHR' +' V'+app.toHex(X) );
                    // 8XY7 VX = VY - VX, VF = not borrow (*) (**)
                    else if(Z==7) row = row.replace( '__ASM__', 'SUBB' +' V'+app.toHex(X)+' , V'+app.toHex(Y) );
                    // 8XYE VX = VX shift left 1 (VX=VX*2), VF = carry (bit 7)
                    else if(Z==8) row = row.replace( '__ASM__', 'SHL' +' V'+app.toHex(X) );
                    // unknown opcode
                    else{ /* ... */ }
                    break;
                case 0x9:
                    // 9XY0 Skip next instruction if VX != VY
                    row = row.replace( '__ASM__', 'SKNE' +' V'+app.toHex(X)+' , V'+app.toHex(Y) );
                    break;
                case 0xA:
                    // ANNN I = NNN
                    row = row.replace( '__ASM__', 'MOV' +' I , '+ app.toHex(NNN,2,'0x') );
                    break;
                case 0xB:
                    // BNNN Jump to NNN + V0
                    row = row.replace( '__ASM__', 'JUMPI' +' '+ app.toHex(NNN,2,'0x') );
                    break;
                case 0xC:
                    // CXKK VX = Random number(0-255) & KK (mask)
                    row = row.replace( '__ASM__', 'RND' +' V'+app.toHex(X) +' , '+ app.toHex(KK,1,'0x') );
                    break;
                case 0xD:
                    //
                    row = row.replace( '__ASM__', 'DRAW' +' V'+app.toHex(X)+' , V'+app.toHex(Y)+ ' , '+Z );
                    break;

                default:

                    break;
            }
            return row;
        },
        emulationStep : function(){
            clearInterval(app.Config.GUIRefreshIntervalRef);
            app.Config.GUIRefreshIntervalRef = null;
            app.wasm._emulationStep();
            app.GUIRefresh(); // run refresh a single time, to ensure its uodated to xurrnt state
        },
        emulationInit: function(){
            clearInterval(app.Config.GUIRefreshIntervalRef);
            app.Config.GUIRefreshIntervalRef = null;
            app.GUI.currentIntructionRow = null;
            app.wasm._emulationInit();
            app.memoryDump();
            app.GUIRefresh(); // run refresh a single time, to ensure its uodated to xurrnt state
        },
        emulationPause: function(){
            clearInterval(app.Config.GUIRefreshIntervalRef);
            app.Config.GUIRefreshIntervalRef = null;
            app.wasm._emulationPause();
            app.GUIRefresh(); // run refresh a single time, to ensure its uodated to xurrnt state
        },
        emulationResume: function(){
            clearInterval(app.Config.GUIRefreshIntervalRef);
            app.Config.GUIRefreshIntervalRef = null;
            app.wasm._emulationResume();
            app.Config.GUIRefreshIntervalRef = setInterval( app.GUIRefresh, app.Config.GUIRefreshInterval );
        },
        emulationReset: function(){
            clearInterval(app.Config.GUIRefreshIntervalRef);
            app.Config.GUIRefreshIntervalRef = null;
            app.GUI.currentIntructionRow = null;
            app.wasm._emulationReset();
            app.memoryDump();
            app.GUIRefresh(); // run refresh a single time, to ensure its uodated to xurrnt state
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


            app.wasm = Module;

            __WASM_MEMORY__ = new Uint8Array( app.wasm.wasmMemory.buffer );
            __REGISTERS_OFFSET__ = app.wasm._getRegistersBlockPointer();

            app.Memory = new Uint8Array( app.wasm.wasmMemory.buffer , app.wasm._getMemoryPointer() , app.wasm._getMemorySize() );
            // generate a view of the Stack memory segment (16 entries of 2 bytes each)
            app.Stack  = new Uint8Array( app.wasm.wasmMemory.buffer , app.wasm._getStackPointer() , 16 * 2 );
            // generate a view of te ROM memory segment ( max size allowed is the
            // total avaikable memory - mounting adress offset 0x0200 )
            app.ROM    = new Uint8Array( app.wasm.wasmMemory.buffer , app.wasm._getRomImagePointer() , app.Memory.length - 0x0200);
            //
            __EMULATOR_STATUS__ = new Uint8Array( app.wasm.wasmMemory.buffer , app.wasm._getStatusPointer() , 1 );
            __CANVAS_DATA__ =  new Uint8Array( app.wasm.wasmMemory.buffer , app.wasm._getCanvasPointer() , 64*32*4 );
            requestAnimationFrame(app.ScreenRefresh);


            let ps = new PerfectScrollbar( document.querySelectorAll('#groupInstructions [group-content]')[0] );
            //const ps = new PerfectScrollbar( document.querySelectorAll("#memory_output );
            app.emulationReset();

            let canvas = app.GUI.display;
            let canvasWidth  = 64;//canvas.width;
            let canvasHeight = 32;//canvas.height;
            app.GUI.ctx = canvas.getContext('2d');
            //ctx.scale(10, 10);
            //ctx.imageSmoothingEnabled = false;
            app.GUI.imageData = app.GUI.ctx.getImageData(0, 0, canvasWidth, canvasHeight);

            return true;
        },
    };

    //Module.asmLibraryArg.__console = app.log;
    Module.onRuntimeInitialized= app.init ;

    //a = new Worker('main.js')
});
