#include <stdint.h>
#include <string.h>
#include <emscripten.h>
#include <stdio.h>
#include <sys/time.h>


#define true                1
#define false               0


#define MEM_ROM_OFFSET      0x0200 // Address of the begining of the ROM in Memory
#define MEM_VIDEO_OFFSET    0x0050
#define MEM_STACK_OFFSET    0x0150

#define MEM_SIZE            4096 // Size of memory handled by the CHIP-8
#define STACK_SIZE          16 // Size of stack


// Prototypes
void handleUnknownInstruction( uint8_t byte1, uint8_t byte2 );


/*
  Sprites representing the hexadecimal digits 0 through F.
  These sprites are 5 bytes long, or 8x5 pixels.

  ------------------  ------------------  ------------------  ------------------
  "0"  Binary   Hex   "1"  Binary   Hex   "2"  Binary   Hex   "3"  Binary   Hex
  ------------------  ------------------  ------------------  ------------------
  **** 11110000 0xF0    *  00100000 0x20  **** 11110000 0xF0  **** 11110000 0xF0
  *  * 10010000 0x90   **  01100000 0x60     * 00010000 0x10     * 00010000 0x10
  *  * 10010000 0x90    *  00100000 0x20  **** 11110000 0xF0  **** 11110000 0xF0
  *  * 10010000 0x90    *  00100000 0x20  *    10000000 0x80     * 00010000 0x10
  **** 11110000 0xF0   *** 01110000 0x70  **** 11110000 0xF0  **** 11110000 0xF0

  ------------------  ------------------  ------------------  ------------------
  "4"  Binary   Hex   "5"  Binary   Hex   "6"  Binary   Hex   "7"  Binary   Hex
  ------------------  ------------------  ------------------  ------------------
  *  * 10010000 0x90  **** 11110000 0xF0  **** 11110000 0xF0  **** 11110000 0xF0
  *  * 10010000 0x90  *    10000000 0x80  *    10000000 0x80     * 00010000 0x10
  **** 11110000 0xF0  **** 11110000 0xF0  **** 11110000 0xF0    *  00100000 0x20
     * 00010000 0x10     * 00010000 0x10  *  * 10010000 0x90   *   01000000 0x40
     * 00010000 0x10  **** 11110000 0xF0  **** 11110000 0xF0   *   01000000 0x40

  ------------------  ------------------  ------------------  ------------------
  "8"  Binary   Hex   9"   Binary   Hex   "A"  Binary   Hex   "B"  Binary   Hex
  ------------------  ------------------  ------------------  ------------------
  **** 11110000 0xF0  **** 11110000 0xF0  **** 11110000 0xF0  ***  11100000 0xE0
  *  * 10010000 0x90  *  * 10010000 0x90  *  * 10010000 0x90  *  * 10010000 0x90
  **** 11110000 0xF0  **** 11110000 0xF0  **** 11110000 0xF0  ***  11100000 0xE0
  *  * 10010000 0x90     * 00010000 0x10  *  * 10010000 0x90  *  * 10010000 0x90
  **** 11110000 0xF0  **** 11110000 0xF0  *  * 10010000 0x90  ***  11100000 0xE0

  ------------------  ------------------  ------------------  ------------------
  "C"  Binary   Hex   "D"  Binary   Hex   "E"  Binary  NHex   "F"N Binary   Hex
  ------------------  ------------------  ------------------  ------------------
  **** 11110000 0xF0  ***  11100000 0xE0  **** 11110000 0xF0  **** 11110000 0xF0
  *    10000000 0x80  *  * 10010000 0x90  *    10000000 0x80  *    10000000 0x80
  *    10000000 0x80  *  * 10010000 0x90  **** 11110000 0xF0  **** 11110000 0xF0
  *    10000000 0x80  *  * 10010000 0x90  *    10000000 0x80  *    10000000 0x80
  **** 11110000 0xF0  ***  11100000 0xE0  **** 11110000 0xF0  *    10000000 0x80

 */

uint8_t MemoryCharSprites[] = {
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
};


// The Chip-8 language is capable of accessing up to 4KB (4,096 bytes) of RAM,
// from location 0x000 (0) to 0xFFF (4095). The first 512 bytes, from 0x000b to
// 0x1FF, are where the interpreter was located, should not be used by programs.


uint8_t haltOnError = false;

uint8_t Status;

uint8_t Keys[16];

uint8_t Memory[MEM_SIZE];

/*
    Screen in CHIP8 is a 64*32 pixel monochrome, where each pixel uses a single
    bit, to store its state (on/off). The screen memory starts in the offset
    0x0050 of te chip8 memory, and requires of 256 bytes (64*32/8)
    ---------------------
    | (0,0)      (63,0) |
    |                   |
    |                   |
    |                   |
    | (0,31)    (63,31) |
    ---------------------
 */
uint8_t* Screen = &Memory[MEM_VIDEO_OFFSET];

// width * height * 4 bytes/pixel (alpha+RGB)
uint8_t Canvas[64*32*4];

void expandvideo(){
    uint32_t c=0;
    for(uint32_t i= 0; i< (64*32/8); i++){

        for(uint8_t b= 0; b<8 ;b++){
            // iterate each bit
            uint8_t pixel ;
            if( ( ( Screen[i] >> (7 - b) ) & 0x1 ) == 1  ) pixel =  255 ;
            else pixel =0;
            Canvas[c] = pixel;
            Canvas[c+1] = pixel;
            Canvas[c+2] = pixel;
            Canvas[c+3] = 255;

        c += 4;
        };

    }
}
/*
    The stack is a LIFO type stucture, buiod with an array of 16-bit values,
    used to store the retrningn address required for the proper behaviour of
    the inst4uctions CALL/RETURN.
    This allows subroutines in the chip8 (up to 16 levels)

    START              ----- grow direction --->                  END
    -----------------------------------------------------------------
    |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
    -----------------------------------------------------------------
    0x0150                                                     0x016F
*/
uint8_t* Stack  = &Memory[MEM_STACK_OFFSET];




uint8_t storageDrive[MEM_SIZE - MEM_ROM_OFFSET];



struct Register {
    // Chip-8 has 16 general purpose 8-bit registers, usually referred to as Vx,
    // where x is a hexadecimal digit (0 through F)
    uint8_t V[16];

    // There is also a 16-bit register called I. This register is generally used
    // to store memory addresses, up to up to 4KB (0xFFF) so only the lowest
    // (rightmost) 12 bits are usually used.
    uint16_t I;

    // 8bit  delay timer register (DT) , holds a 8bit numeric counter
    uint8_t DT;

    // 8bit  sound timer register (ST) , holds a 8bit numeric counter
    uint8_t ST;

    // program counter (PC) should be 16-bit, and is used to store the currently
    // executing addressnin memory
    uint16_t PC;

    // stack pointer (SP) can be 8-bit, it is used to point to the
    // topmost level of the stack.
    uint8_t SP;
} Register;


int clearRegisters(){
    EM_ASM({ console.log("[wasm] clearRegisters() : Clearing registers..."); });
    memset( &Register, 0x00, sizeof(struct Register) );

    return true;
}

int clearMemory(){
    EM_ASM({ console.log("[wasm] clearMemory() : Clearing memory..."); });

    memset( Memory, 0x00, sizeof(Memory) );
    // The data should be stored in the interpreter area of Chip-8 memory (0x000 to 0x1FF)
    memcpy( Memory , MemoryCharSprites, sizeof(MemoryCharSprites) );

    return true;
}


void step(){
    uint16_t NNN = ( (Memory[ Register.PC ] & 0x0F) << 8 ) | Memory[ Register.PC +1 ];
    uint8_t  KK =  Memory[ Register.PC + 1 ];
    uint8_t  X = Memory[ Register.PC ] & 0x0F;  // mask : 00001111
    uint8_t  Y = Memory[ Register.PC + 1 ] >> 4;


    switch( Memory[ Register.PC ] >> 4 ){
        case 0x00:
            if(KK == 0xEE){
                // 00EE Return from a CHIP-8 sub-routine
                // TODO : check if SP == 0, before decrement to prevent negative
                // values. Throw error if needed
                Register.SP--;
                // join 2 memory 8bit values to generate the PC 16bit value (BIG ENDIAN)
                Register.PC = ( ( (uint16_t) Memory[MEM_STACK_OFFSET + (Register.SP*2)] ) << 8 ) |  Memory[ MEM_STACK_OFFSET + (Register.SP*2) + 1 ];
                // clear stack
                Memory[MEM_STACK_OFFSET + (Register.SP*2)] = 0x00;
                Memory[MEM_STACK_OFFSET + (Register.SP*2)+1] = 0x00;
            }else{
                // handle unknown instruction
                handleUnknownInstruction( Memory[ Register.PC ] , Memory[ Register.PC +1 ]);
            }
            break;
        case 0x01:
            // jumo to nnn
            Register.PC = NNN;
            break;
        case 0x02:
            // Call CHIP-8 sub-routine at NNN (16 successive calls max)
            // store in stack next instruction  addres as returing point
            // TODO : check if SP == 16, before increment to prevent negative
            // values. Throw error if needed
            Memory[MEM_STACK_OFFSET + (Register.SP*2)] = (Register.PC+2) >> 8;
            Memory[MEM_STACK_OFFSET + (Register.SP*2) +1] = (Register.PC+2) & 0x00FF;
            Register.SP++;
            Register.PC = NNN;
            break;
        case 0x03:
            // 3XKK = Skip next instruction if VX == KK
            if( Register.V[X] == KK ) Register.PC += 2;
            Register.PC += 2;
            break;
        case 0x04:
            // 4XKK Skip next instruction if VX != KK
            if( Register.V[X] != KK ) Register.PC += 2;
            Register.PC += 2;
            break;
        case 0x05:
            // 5XY0 Skip next instruction if VX == VY
            if( Register.V[X] == Register.V[Y] ) Register.PC += 2;
            Register.PC += 2;
            break;
        case 0x06:
            // 6XKK VX = KK
            Register.V[X] = KK;
            Register.PC += 2;
            break;
        case 0x07:
            // 7XKK VX = VX + KK
            Register.V[X] += KK;
            Register.PC += 2;
            break;
        case 0x08:
            switch( KK & 0x0F ){
                case 0x00:
                    // 8XY0 VX = VY
                    Register.V[X] = Register.V[Y];
                    Register.PC += 2;
                    break;
                case 0x01:
                    // 8XY1 VX = VX OR VY
                    Register.V[X] |= Register.V[Y];
                    Register.PC += 2;
                    break;
                case 0x02:
                    // 8XY2 VX = VX AND VY
                    Register.V[X] &= Register.V[Y];
                    Register.PC += 2;
                    break;
                case 0x03:
                    // 8XY3 VX = VX XOR VY (*)
                    Register.V[X] ^= Register.V[Y];
                    Register.PC += 2;
                    break;
                case 0x04:
                    // 8XY4 VX = VX + VY, VF = carry
                    Register.V[0xF] =  Register.V[X] > (uint8_t) ( Register.V[X] + Register.V[Y] );
                    Register.V[X]  += Register.V[Y];
                    Register.PC += 2;
                    break;
                case 0x05:
                    // 8XY5 VX = VX - VY, VF = not borrow (**)
                    Register.V[0xF] = Register.V[X] > Register.V[Y];
                    Register.V[X]  -= Register.V[Y];
                    Register.PC += 2;
                    break;
                case 0x06:
                    // 8XY6 VX = VX SHR 1 (VX=VX/2), VF = carry
                    Register.V[0xF] = Register.V[X] & 0x01;
                    Register.V[X] >>= 1;
                    Register.PC += 2;
                    break;
                case 0x07:
                    // 8XY7 VX = VY - VX, VF = not borrow (*) (**)
                    Register.V[0xF] = Register.V[Y] > Register.V[X];
                    Register.V[X]   = Register.V[Y] - Register.V[X];
                    Register.PC += 2;
                    break;
                case 0x0E:
                    // 8XYE VX = VX SHL 1 (VX=VX*2), VF = carry
                    Register.V[0xF] = (Register.V[X] & 0x80) != 0; // mask : 10000000 00000000
                    Register.V[X] <<= 1;
                    Register.PC += 2;
                    break;
                default:
                    // handle unknown instruction
                    handleUnknownInstruction( Memory[ Register.PC ] , Memory[ Register.PC +1 ]);
                    break;
            }
            break;
        case 0x09:
            // 9XY0 Skip next instruction if VX != VY
            if( Register.V[X] != Register.V[Y] ) Register.PC += 2;
            Register.PC += 2;
            break;
        case 0x0A:
            // ANNN I = NNN
            Register.I = NNN;
            Register.PC += 2;
            break;
        case 0x0B:
            // BNNN Jump to NNN + V0
            Register.PC = NNN + Register.V[0];
            break;
        case 0x0C:
            // CXKK VX = Random number AND KK
            //int randomNumber = 5;
            //Register.V[X] = randomNumber & KK;
            Register.PC += 2;
            break;
        case 0x0D:
            // DXYN
            // Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels
            // and a height of N pixels. Each row of 8 pixels is read as bit-coded
            // starting from memory location I; I value doesn’t change after the
            // execution of this instruction. As described above, VF is set to 1 if
            // any screen pixels are flipped from set to unset when the sprite is
            // drawn, and to 0 if that doesn’t happen
            //
            // Iterate each requested sprite line (n)
            //
            /**
             * Considering that register I , stores an adress wich value is :
             * 0xFF (0b11111111)
             *
             * MOV V0, 5
             * MOV V1, 0
             * DRW 0,1,1  // draw 1-line (8bits) sprite in x=6 y=0
             * Pxels are bytepacked in he chip8
             * We need to draw 8 pixels in a single line, starting from the 6th
             * pixel till the 13th. Is easy to see in the next represention how
             * part of the sprite will affect the first byte of the screen memory
             * and anothdr part the second byte.
             * This sitation forces us to calculate wich bytes are going to be
             * affected, the splitting point, and the necessary required padding
             * in each resulting part, to align the bits in order to procees
             * applying the byte mask.
             *
             *                             Sprite (0xF0)
             *                     ┌───────────────────────────────┐
             *                     │ 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 │
             *                     └───────────────────────────────┘
             *                             DRAW 5,0
             *                                 |
             *                                 V
             *   --------------- Screen Memory (1 pixel=1 bit)---------------->
             *   0   1   2   3   4   5   6   7   8   9   10  11  12  13  14  15
             * ┌───────────────────┲━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━┱───────────┐
             * │ 0 | 0 | 0 | 0 | 0 ┃ 1 | 1 | 1 ┃ 1 | 0 | 0 | 0 | 0 ┃ 0 | 0 | 0 │
             * └───────────────────┺━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━┹───────────┘
             *  └┄┄┄┄┄┄┄┄┄┄ byte 0 ┄┄┄┄┄┄┄┄┄┄┄┘ └┄┄┄┄┄┄┄┄┄┄ byte 1 ┄┄┄┄┄┄┄┄┄┄┄┘
             *               0x07                            0xF8
             *
             * Some handfull formulas :
             * byteOffset  = (x / 8 ) + (y * (screen_width / 8) )
             * bytePadding = x % 8
             * sprite_byte1 = sprite >> ( 8 - bytePadding )
             * sprite_byte2 = sprite << bytePadding
             *
             * (5/8) + ( 0 * ( 64/8) ) = 0
             * 5 % 8 = 3
             *
             *
            */
            // set collision flag to 0
            Register.V[0xF] = 0;
            // calculate ...
            uint8_t  N          = KK & 0x0F;
            uint16_t byteOffset = ( Register.V[X] / 8 ) + ( Register.V[Y] * 64/8 );

            uint8_t bytePadding =  Register.V[X] % 8;

            uint8_t spriteByte;
            uint8_t spriteByteXored;
            uint8_t screenByteHi;
            uint8_t screenByteLo;
            // iterate each Sprite line ( N )
            for(uint8_t n=0; n<N; n++){
                // update byteOffset according to the current sprite line
                // ( adds 64/8 byres for each line )
                //
                // TODO: if Y+N>¿32? wrap to the top, to pevent memory overflow
                //
                uint16_t offset =  byteOffset + ( (64/8) * n );
                // align the sprite byte with the calculated padding
                spriteByte = Memory[Register.I+n] >>  bytePadding;

                // prepare the receiver memory byte for XOR operation,
                // removing from it the unneded bits
                //
                uint8_t screenByteHi =  (0xFF <<  (8-bytePadding) ) & Screen[offset];
                uint8_t screenByteLo =  (0xFF >>  bytePadding) & Screen[offset];


                if(spriteByte & screenByteLo) Register.V[0xF] = 0x01;

                spriteByteXored = ( spriteByte  ^  screenByteLo ) & (0xFF >>  bytePadding);

                Screen[offset] = screenByteHi | spriteByteXored;

                if(bytePadding > 0){
                    spriteByte = Memory[Register.I+n] << ( 8 -  bytePadding );
                    screenByteHi =  (0xFF <<  (8-bytePadding) ) & Screen[offset+1];
                    screenByteLo =  (0xFF >>  bytePadding) & Screen[offset+1];
                    if(spriteByte & screenByteHi) Register.V[0xF] = 0x01;
                    spriteByteXored = ( spriteByte  ^  screenByteHi ) & (0xFF <<  (8-bytePadding) );
                    Screen[offset+1] =  spriteByteXored | screenByteLo;
                }



            }
              expandvideo();
                Register.PC += 2;

            /*
                // get the  current line of the sprite
                uint8_t sprite = Memory[Register.I + n];
                // iterate each bit of the sprite current line
                for (int i = 0; i < 7; i++) {
                    // if X is multiple of 8, means the sprite will be aligned
                    // with the begining of the byte that wil
                    uint8_t bytePadding = Register.V[X] % 8 ;
                    // check if X < 64 , Y < 32
                    // calculate the byte in screen memory where
                    uint8_t byteNum     = ( Register.V[X] / 8 ) + ( Register.V[Y] * 64/8 );
                    if( padding == 0 ){

                    }else{

                        padding = x%8
                        mask = 0b11111111 << padding
                        byte1 = byte1 & mask
                        sprite_byte1 = sprite  >> padding
                        byte_1 = byte1 & sprite_byte1
                    }

                    // C
                    int px = Register.v[x] + n) & 63;
                    int py = Register.v[y] + n) &  31;
                    int pos = 64 * py + px;
                    // What to plot.
                    int pixel = (sprite & (1 << (7-i))) != 0;
                    cpu->V[0XF] |= (cpu->screen[pos] & pixel);
                    cpu->screen[pos] ^= pixel;

                //}
            }

             */
            break;
        default:
            // handle unknown instruction
            handleUnknownInstruction( Memory[ Register.PC ] , Memory[ Register.PC +1 ]);
            break;
    }
    if( Register.PC > MEM_SIZE ) Register.PC = MEM_ROM_OFFSET;
}


void loop(){
    while(Status==1){
        // get initial time
        struct timeval tv;
        gettimeofday(&tv,NULL);

        step();

        // get final time
        struct timeval tv2;
        gettimeofday(&tv2,NULL);
        unsigned long long time_in_micros2 = ( tv2.tv_sec * (uint64_t)1000000 ) + tv2.tv_usec;
        // calculateelapsed time in microseconds
        uint64_t f= ( (tv2.tv_sec - tv.tv_sec) * 1000000 ) + (tv2.tv_usec - tv.tv_usec);

       // EM_ASM({ console.log("[wasm] cycle elapsed useconds:", $0); } , f);

        emscripten_sleep(1);
    }
}





int EMSCRIPTEN_KEEPALIVE main(int argc, char** argv){
    EM_ASM({ console.log("[wasm] main() : Initiatiin completed. System Ready!"); });
    return true;
}


/* Public API exported methods */

void EMSCRIPTEN_KEEPALIVE emulationReset(){
    Status=0; // status=stopped
    clearRegisters();
    clearMemory();
    Register.PC = MEM_ROM_OFFSET;
}

void EMSCRIPTEN_KEEPALIVE emulationInit(){
    emulationReset();
    memcpy( Memory + MEM_ROM_OFFSET , storageDrive, sizeof(storageDrive) );
    Status = 2; //status=paused
}

void EMSCRIPTEN_KEEPALIVE emulationPause(){
    Status = 2; // status=paused
}

void EMSCRIPTEN_KEEPALIVE emulationResume(){
    Status = 1;
    loop();
}

void EMSCRIPTEN_KEEPALIVE emulationStep(){
    Status = 2; // status=paused
    step();
}

uintptr_t EMSCRIPTEN_KEEPALIVE getStackPointer(){ return ( uintptr_t ) Memory + MEM_STACK_OFFSET; }
uintptr_t EMSCRIPTEN_KEEPALIVE getRegistersBlockPointer(){return ( uintptr_t ) &Register; }
uintptr_t EMSCRIPTEN_KEEPALIVE getRomImagePointer(){ return ( uintptr_t ) storageDrive; }
uintptr_t EMSCRIPTEN_KEEPALIVE getMemoryPointer(){ return ( uintptr_t ) Memory; }
uintptr_t EMSCRIPTEN_KEEPALIVE getStatusPointer(){ return ( uintptr_t ) &Status; }
uintptr_t EMSCRIPTEN_KEEPALIVE getCanvasPointer(){ return ( uintptr_t ) Canvas; }

uint64_t  EMSCRIPTEN_KEEPALIVE getMemorySize(){ return sizeof(Memory); }

uint8_t EMSCRIPTEN_KEEPALIVE setHaltOnError( uint8_t value ){ return haltOnError = (value == 0) ? 0 : 1; }
uint8_t EMSCRIPTEN_KEEPALIVE getHaltOnError( uint8_t value ){ return haltOnError; }

uint8_t EMSCRIPTEN_KEEPALIVE updateScreenMemory(){
    expandvideo();
    return true;
}

uint8_t EMSCRIPTEN_KEEPALIVE setPixel(uint32_t p){
    p = p*4;
    Canvas[p] = 255;
    Canvas[p+1] = 255;
    Canvas[p+2] = 255;
    Canvas[p+3] = 255;
    return true;
}

void handleUnknownInstruction( uint8_t byte1, uint8_t byte2 ){
    EM_ASM({ console.log("[wasm] Unknown instruction:", $0, $1); } , byte1, byte2);
    if(haltOnError){
        EM_ASM({ console.log("[wasm] Execution Interrupted."); });
        emulationPause();
    }else{
        // ignore the unknown instruction, increase the PC value normally, and
        // continue execution
        Register.PC += 2;
    }
}
