#include "mgos_hal.h"
#include "mgos_bitbang.h"
#include "mgos_gpio.h"
#include "mgos_mongoose.h"
#include "mgos_utils.h"

int timing_t0h = 3;
int timing_t0l = 10;
int timing_t1h = 10;
int timing_t1l = 3;

void cf_write(int gpio, const uint8_t *data, size_t len) {
  
  /*
    GPIO.write(this.pin, 0);
    Sys.usleep(60);
    BitBang.write(this.pin, BitBang.DELAY_100NSEC, 3, 10, 10, 3, this.data, this.len);
    GPIO.write(this.pin, 0);
    Sys.usleep(60);
    GPIO.write(this.pin, 1);
  */
  
    mgos_gpio_write(gpio, 0);
    mgos_usleep(60);
  
    mgos_bitbang_write_bits( gpio, 2, timing_t0h, timing_t0l, timing_t1h, timing_t1l, data, len );
  
    mgos_gpio_write(gpio, 0);
    mgos_usleep(60);  
    mgos_gpio_write(gpio, 1);
}

void cf_flicker( int gpio, int count, const uint8_t *data, size_t len ) {
  uint8_t *off_data = malloc(len);
  memset(off_data, 0, len);
  
  for ( int i = 0; i < count; i++ ) {
    cf_write( gpio, data, len );
    mgos_usleep(mgos_rand_range(1000, 200000));
    
    cf_write( gpio, off_data, len );
    mgos_usleep(mgos_rand_range(1000, 200000));
  }
  
  free(off_data);
}

