#ifndef IO_HPP_
#define IO_HPP_

#include "types.hpp"

#define PERIPHERAL_BASE 0xFE000000

void uart_init();
void uart_writeText(char *buffer);
void uart_loadOutputFifo();
u8 uart_readByte();
u32 uart_isReadByteReady();
void uart_writeByteBlocking(u8 ch);
void uart_update();
void mmio_write(long reg, u32 val);
u32 mmio_read(long reg);

#endif