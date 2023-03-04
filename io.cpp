#include "io.hpp"
#include "types.hpp"

// GPIO

enum {
    GPFSEL0         = PERIPHERAL_BASE + 0x200000,
    GPSET0          = PERIPHERAL_BASE + 0x20001C,
    GPCLR0          = PERIPHERAL_BASE + 0x200028,
    GPPUPPDN0       = PERIPHERAL_BASE + 0x2000E4
};

enum {
    GPIO_MAX_PIN       = 53,
    GPIO_FUNCTION_OUT  = 1,
    GPIO_FUNCTION_ALT5 = 2,
    GPIO_FUNCTION_ALT3 = 7
};

enum {
    Pull_None = 0,
    Pull_Down = 1, // Are down and up the right way around?
    Pull_Up = 2
};

void mmio_write(long reg, u32 val) { *(volatile u32 *)reg = val; }
u32 mmio_read(long reg) { return *(volatile u32 *)reg; }

u32 gpio_call(u32 pin_number, u32 value, u32 base, u32 field_size, u32 field_max) {
    u32 field_mask = (1 << field_size) - 1;
  
    if (pin_number > field_max) return 0;
    if (value > field_mask) return 0; 

    u32 num_fields = 32 / field_size;
    u32 reg = base + ((pin_number / num_fields) * 4);
    u32 shift = (pin_number % num_fields) * field_size;

    u32 curval = mmio_read(reg);
    curval &= ~(field_mask << shift);
    curval |= value << shift;
    mmio_write(reg, curval);

    return 1;
}

u32 gpio_set     (u32 pin_number, u32 value) { return gpio_call(pin_number, value, GPSET0, 1, GPIO_MAX_PIN); }
u32 gpio_clear   (u32 pin_number, u32 value) { return gpio_call(pin_number, value, GPCLR0, 1, GPIO_MAX_PIN); }
u32 gpio_pull    (u32 pin_number, u32 value) { return gpio_call(pin_number, value, GPPUPPDN0, 2, GPIO_MAX_PIN); }
u32 gpio_function(u32 pin_number, u32 value) { return gpio_call(pin_number, value, GPFSEL0, 3, GPIO_MAX_PIN); }

void gpio_useAsAlt3(u32 pin_number) {
    gpio_pull(pin_number, Pull_None);
    gpio_function(pin_number, GPIO_FUNCTION_ALT3);
}

void gpio_useAsAlt5(u32 pin_number) {
    gpio_pull(pin_number, Pull_None);
    gpio_function(pin_number, GPIO_FUNCTION_ALT5);
}

void gpio_initOutputPinWithPullNone(u32 pin_number) {
    gpio_pull(pin_number, Pull_None);
    gpio_function(pin_number, GPIO_FUNCTION_OUT);
}

void gpio_setPinOutputBool(u32 pin_number, u32 onOrOff) {
    if (onOrOff) {
        gpio_set(pin_number, 1);
    } else {
        gpio_clear(pin_number, 1);
    }
}

// UART

enum {
    AUX_BASE        = PERIPHERAL_BASE + 0x215000,
    AUX_IRQ         = AUX_BASE,
    AUX_ENABLES     = AUX_BASE + 4,
    AUX_MU_IO_REG   = AUX_BASE + 64,
    AUX_MU_IER_REG  = AUX_BASE + 68,
    AUX_MU_IIR_REG  = AUX_BASE + 72,
    AUX_MU_LCR_REG  = AUX_BASE + 76,
    AUX_MU_MCR_REG  = AUX_BASE + 80,
    AUX_MU_LSR_REG  = AUX_BASE + 84,
    AUX_MU_MSR_REG  = AUX_BASE + 88,
    AUX_MU_SCRATCH  = AUX_BASE + 92,
    AUX_MU_CNTL_REG = AUX_BASE + 96,
    AUX_MU_STAT_REG = AUX_BASE + 100,
    AUX_MU_BAUD_REG = AUX_BASE + 104,
    AUX_UART_CLOCK  = 500000000,
    UART_MAX_QUEUE  = 16 * 1024
};

#define AUX_MU_BAUD(baud) ((AUX_UART_CLOCK/(baud*8))-1)

u8 uart_output_queue[UART_MAX_QUEUE];
u32 uart_output_queue_write = 0;
u32 uart_output_queue_read = 0;

void uart_init() {
    mmio_write(AUX_ENABLES, 1); //enable UART1
    mmio_write(AUX_MU_IER_REG, 0);
    mmio_write(AUX_MU_CNTL_REG, 0);
    mmio_write(AUX_MU_LCR_REG, 3); //8 bits
    mmio_write(AUX_MU_MCR_REG, 0);
    mmio_write(AUX_MU_IER_REG, 0);
    mmio_write(AUX_MU_IIR_REG, 0xC6); //disable interrupts
    mmio_write(AUX_MU_BAUD_REG, AUX_MU_BAUD(115200));
    gpio_useAsAlt5(14);
    gpio_useAsAlt5(15);
    mmio_write(AUX_MU_CNTL_REG, 3); //enable RX/TX
}

u32 uart_isOutputQueueEmpty() {
    return uart_output_queue_read == uart_output_queue_write;
}

u32 uart_isReadByteReady()  { return mmio_read(AUX_MU_LSR_REG) & 0x01; }
u32 uart_isWriteByteReady() { return mmio_read(AUX_MU_LSR_REG) & 0x20; }

u8 uart_readByte() {
    while (!uart_isReadByteReady());
    return (u8)mmio_read(AUX_MU_IO_REG);
}

void uart_writeByteBlockingActual(u8 ch) {
    while (!uart_isWriteByteReady()); 
    mmio_write(AUX_MU_IO_REG, (u32)ch);
}

void uart_loadOutputFifo() {
    while (!uart_isOutputQueueEmpty() && uart_isWriteByteReady()) {
        uart_writeByteBlockingActual(uart_output_queue[uart_output_queue_read]);
        uart_output_queue_read = (uart_output_queue_read + 1) & (UART_MAX_QUEUE - 1); // Don't overrun
    }
}

void uart_writeByteBlocking(u8 ch) {
    u32 next = (uart_output_queue_write + 1) & (UART_MAX_QUEUE - 1); // Don't overrun

    while (next == uart_output_queue_read) uart_loadOutputFifo();

    uart_output_queue[uart_output_queue_write] = ch;
    uart_output_queue_write = next;
}

void uart_writeText(char *buffer) {
    while (*buffer) {
       if (*buffer == '\n') uart_writeByteBlocking('\r');
       uart_writeByteBlocking(*buffer++);
    }
}

void uart_drainOutputQueue() {
    while (!uart_isOutputQueueEmpty()) uart_loadOutputFifo();
}

void uart_update() {
    uart_loadOutputFifo();

    if (uart_isReadByteReady()) {
       u8 ch = uart_readByte();
       if (ch == '\r') uart_writeText("\n"); else uart_writeByteBlocking(ch);
    }
}
