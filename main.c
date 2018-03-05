#include <stdint.h>
#include <string.h>
#include <emscripten.h>
#include <stdio.h>
#include <sys/time.h>


#define true 1
#define false 0

#define MEM_SIZE 4096 // Size of memory handled by the CHIP-8
#define MEM_ROM_OFFSET 0x0200 // Address of the begining of the ROM in Memory
#define STACK_SIZE 16 // Size of stack


// Define the JavaScript method's signature that we're going to be calling.
#define CONSOLE_LOG_MAXSIZE 1024

extern void _console(int msg_ptr);

char console_msg[ CONSOLE_LOG_MAXSIZE ];

/**
 * [console description]
 * @param msg [description]
 */
void console( char* msg ){
    int i = 0;
    while(true){
        if( msg[i] == '\0' || i == CONSOLE_LOG_MAXSIZE){
             console_msg[i] = '\0';
             break;
        }
        console_msg[i] = msg[i];
        i++;
    }
    _console( (int) console_msg );
    return;
}


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


/*


 */

// The Chip-8 language is capable of accessing up to 4KB (4,096 bytes) of RAM,
// from location 0x000 (0) to 0xFFF (4095). The first 512 bytes, from 0x000b to
// 0x1FF, are where the interpreter was located, should not be used by programs.


uint8_t Status;

uint8_t Memory[MEM_SIZE];

uint8_t RomImage[MEM_SIZE - MEM_ROM_OFFSET];

// The stack is an array of 16 16-bit values, used to store the address that
// the interpreter shoud return to when finished with a subroutine.
// Chip-8 allows  for up to 16 levels of nested subroutines.
uint16_t Stack[STACK_SIZE];

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




// Yet, another good itoa implementation
// returns: the length of the number string
int itoa(int value, char *sp, int radix)
{
    char tmp[16];// be careful with the length of the buffer
    char *tp = tmp;
    int i;
    unsigned v;

    int sign = (radix == 10 && value < 0);
    if (sign)
        v = -value;
    else
        v = (unsigned)value;

    while (v || tp == tmp)
    {
        i = v % radix;
        v /= radix; // v/=radix uses less CPU clocks than v=v/radix does
        if (i < 10)
          *tp++ = i+'0';
        else
          *tp++ = i + 'a' - 10;
    }

    int len = tp - tmp;

    if (sign)
    {
        *sp++ = '-';
        len++;
    }

    while (tp > tmp)
        *sp++ = *--tp;

    return len;
}






int EMSCRIPTEN_KEEPALIVE clearRegisters(){
    console( "clearRegisters() : Clearing registers..." );
    memset( &Register, 0x00, sizeof(struct Register) );

    return true;
}

int EMSCRIPTEN_KEEPALIVE clearMemory(){
    console( "clearMemory() : Clearing memory..." );

    memset( Memory, 0x00, sizeof(Memory) );
    // The data should be stored in the interpreter area of Chip-8 memory (0x000 to 0x1FF)
    memcpy( Memory , MemoryCharSprites, sizeof(MemoryCharSprites) );

    return true;
}



void EMSCRIPTEN_KEEPALIVE step(){
   // console("cycle");
    uint16_t NNN = ( Memory[ Register.PC ] << 8 ) | Memory[ Register.PC +1 ];
    uint8_t  KK =  Memory[ Register.PC + 1 ];
    uint8_t  X = Memory[ Register.PC ] & 0x0F;  // mask : 00001111
    uint8_t  Y = Memory[ Register.PC + 1 ] >> 4;

    uint8_t r;

    switch( Memory[ Register.PC ] >> 4 ){
        case 0x00:
            break;
        case 0x01:
            // jumo to nnn
            Register.PC = NNN;
            break;
        case 0x02:
            // Call CHIP-8 sub-routine at NNN (16 successive calls max)
            Stack[Register.SP] = Register.PC;
            Register.SP++;
            Register.PC = NNN;
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
            console("opcode family 0x08");
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
        default:
            Register.PC += 2;
            console("default");
            break;
    }
    if( Register.PC > MEM_SIZE ) Register.PC = MEM_ROM_OFFSET;
}


void EMSCRIPTEN_KEEPALIVE loop(){
    while(Status){
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

        EM_ASM({ console.log("elapsed useconds:", $0); } , f);

        emscripten_sleep(1);
    }
}
        /*
    while(true){
        //step();
    }
    EM_ASM({
        let a = performance.now();
        //console.log($0,$1,$2);
        // setInterval( app.step , 10 );
    }, 1,44,7.8);
    */

int EMSCRIPTEN_KEEPALIVE loadRom(){
    console("loadRom() : Reseting machine..");
    clearRegisters();
    clearMemory();
    console("loadRom() : Loading ROM...");
    memcpy( Memory + MEM_ROM_OFFSET , RomImage, sizeof(RomImage) );

    console("loadRom() : Reseting PC Register ( to position MEM_ROM_OFFSET )...");
    Register.PC = MEM_ROM_OFFSET;
    Status = true;
    return true;
}




int EMSCRIPTEN_KEEPALIVE init(){


    console( "Initiating..." );


    return true;
}

int EMSCRIPTEN_KEEPALIVE main(int argc, char** argv){


    console( "main() :mReady!" );


    return true;
}
/**
 * [setStatus description]
 * @param statusCode 1= run 0 = stop
 */
void EMSCRIPTEN_KEEPALIVE resumeExecution(){
    Status = 1;
    loop();
}
void EMSCRIPTEN_KEEPALIVE pauseExecution(){ Status = 0; }
void EMSCRIPTEN_KEEPALIVE stepExecution(){ step(); }

uintptr_t EMSCRIPTEN_KEEPALIVE getStackPointer(){    return ( uintptr_t ) Stack; }
uintptr_t EMSCRIPTEN_KEEPALIVE getRegistersBlockPointer(){return ( uintptr_t ) &Register; }
uintptr_t EMSCRIPTEN_KEEPALIVE getRomImagePointer(){ return ( uintptr_t ) RomImage; }
uintptr_t EMSCRIPTEN_KEEPALIVE getMemoryPointer(){   return ( uintptr_t ) Memory; }
uint64_t  EMSCRIPTEN_KEEPALIVE getMemorySize(){      return sizeof(Memory); }






