
#include <stdint.h>
#include <string.h>
// #include <stdio.h>


#define true 1
#define false 0

#define MEM_SIZE 4096 // Size of memory handled by the CHIP-8

// Define the JavaScript method's signature that we're going to be calling.
extern void _console(char* str);


// The Chip-8 language is capable of accessing up to 4KB (4,096 bytes) of RAM,
// from location 0x000 (0) to 0xFFF (4095). The first 512 bytes, from 0x000b to
// 0x1FF, are where the interpreter was located, should not be used by programs.
uint8_t Memory[MEM_SIZE];


struct register_t {
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

    // The stack is an array of 16 16-bit values, used to store the address that
    // the interpreter shoud return to when finished with a subroutine.
    // Chip-8 allows  for up to 16 levels of nested subroutines.
    uint16_t Stack[16];
};


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



struct register_t Register;


int loadRom(const char* file){
   /*
    FILE* fp = fopen(file, "rb");
    if (fp == NULL) {
        fprintf(stderr, "Cannot open ROM file.\n");
        return false;
    }

    // Use the fseek/ftell/fseek trick to retrieve file size.
    fseek(fp, 0, SEEK_END);
    int length = ftell(fp);
    fseek(fp, 0, SEEK_SET);

    // Check the length of the rom. Must be as much 3584 bytes long, which
    // is 4096 - 512. Since first 512 bytes of memory are reserved, program
    // code can only allocate up to 3584 bytes. Must check for bounds in
    // order to avoid buffer overflows.
    if (length > 3584) {
        fprintf(stderr, "ROM too large.\n");
        return false;
    }

    // Everything is OK, read the ROM, and store it in Memory positionn 0x200
    fread(Memory + 0x200, length, 1, fp);
    fclose(fp);
    */
    return true;
}

int getMemoryPointer(){ return ( int ) Memory; }
int getMemorySize(){ return sizeof(Memory); }

int clearRegisters(){
    memset( &Register, 0x00, sizeof(struct register_t) );
    return true;
}

int clearMemory(){
    // memset( &Memory[0], 0x00, sizeof(Memory) );
    int i = 0;
    int mem_size = getMemorySize();
    while(i<mem_size){
        Memory[i] = 0;
        i++;
    }
    return true;
}

int init(int argc, char** argv){
    //printf("stat!.\n");
    _console(0);
    clearRegisters();
    clearMemory();
    //memset( &Memory, 0x00, sizeof(Memory) );
    // The data should be stored in the interpreter area of Chip-8 memory (0x000 to 0x1FF)
    memcpy( Memory , MemoryCharSprites, sizeof(MemoryCharSprites) );

    Register.PC = 0x200;

    loadRom("PONG");
    return true;
}








