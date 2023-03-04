#ifndef FB_HPP_
#define FB_HPP_

#include "types.hpp"

void fb_init();
void drawPixel(int x, int y, u8 attr);
void drawChar(u8 ch, int x, int y, u8 attr);
void drawString(int x, int y, char *s, u8 attr);
void drawRect(int x1, int y1, int x2, int y2, u8 attr, int fill);
void drawCircle(int x0, int y0, int radius, u8 attr, int fill);
void drawLine(int x1, int y1, int x2, int y2, u8 attr);

#endif