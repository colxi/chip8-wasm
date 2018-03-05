/*
* @Author: colxi
* @Date:   2018-03-03 11:41:35
* @Last Modified by:   colxi
* @Last Modified time: 2018-03-03 11:41:57
*/
uint8_t memoryCopy(void *dest, void *src, size_t n){
   if(!dest||!src) return 0;

   // Typecast src and dest addresses to (uint8_t *)
   uint8_t *s = (uint8_t *)src;
   uint8_t *d = (uint8_t *)dest;

   // Copy contents of s[] to d[]
   while(n--) {*d++ = *s++;}

   return 1;
}

uint8_t memoryFill(void *dest, uint8_t val, size_t n){
   if(!dest) return 0;

   // Typecast  dest addresses to (uint8_t *)
   uint8_t *d = (uint8_t *)dest;

   // repeat value in d[]
   while(n--) {*d++ = val;}

   return 1;
}
