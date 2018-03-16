load('api_config.js');
load('api_gpio.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load("api_mqtt.js");
load("api_log.js");
load('api_neopixel.js');
load("api_aws.js");
load("api_http.js");

Log.info('Initializing...');

let led = Cfg.get('pins.led');
let button = Cfg.get('pins.button');

let pin = 14, numPixels = 100, colorOrder = NeoPixel.RGB;
let strip = NeoPixel.create(pin, numPixels, colorOrder);
let state = { christmas: false, on: false, slaves: [] };

let Command = {
  SLAVES_RESUME: -4,
  SLAVES_OFF: -3,
  FLICKER: -2,
  ALL_OFF: -1
};

let queue = [];
let processing = false;

// Custom function to more realistically flicker the lights
// Arguments are: GPIO int, number of flickers, data to write for on, length of data to write for on. Off = 0 for same length.
let flicker = ffi('int cf_flicker(int, int, void *, int)');

strip.clear();
strip.show();

// Order: red, yellow, blue, orange, green
let colors = Sys.malloc(numPixels * 3);
for (let i = 0; i < numPixels; i++) {
  let color = i % 5;
  let red = 0;
  let blue = 0;
  let green = 0;
  if ( color === 0 ) {  //red
    red = 255;
    blue = 0;
    green = 0;
  } else if ( color === 1 ) { //yellow
    red = 255;
    blue = 0;
    green = 255;
  } else if ( color === 2 ) { //blue
     red = 0;
    blue = 255;
    green = 0;
  } else if ( color === 3 ) { //orange
    red = 255;
    blue = 0;
    green = 165;
  } else if ( color === 4 ) { //green
    red = 0;
    blue = 0;
    green = 255;
  }
  
  colors[(3 * i)] = red;
  colors[(3 * i) + 1] = green;
  colors[(3 * i) + 2] = blue;
}

// Set a single pixel to it's assigned color
let setPixel = function( i ) {
  let r = colors[(3*i)];
  let g = colors[(3*i)+1];
  let b = colors[(3*i)+2];
  strip.setPixel(i, r, g, b);
};

// Set all pixels on to their assigned colors
let setAllPixels = function() {
  for (let i = 0; i < numPixels; i++) {
    setPixel(i);
  }
};

let setSlaves = function(value, cb) {
  if ( state.slaves ) {
    for ( let i = 0; i < state.slaves.length; i++) {
      let slaveIP = state.slaves[i];
      if ( slaveIP ) {
        print('Slave', slaveIP, '->', value);
        let url = 'http://' + slaveIP + '/cgi-bin/relay.cgi?' + (value === true ? 'on' : 'off');
        print(url);
        HTTP.query({
          url: url,
          success: cb,
          error: cb
        });
      }
    }
  }
};

// Show a single pixel for the amount of time on,
// then wait the amount of time off before returning
/*let showOne = function( i, timeOn, timeOff ) {
  print( i, timeOn, timeOff );
  
  strip.clear();
  setPixel(i);
  strip.show();
  
  Sys.usleep( timeOn * 1000 );
  
  strip.clear();
  strip.show();
  Sys.usleep( timeOff * 1000 );
};*/

// Calculate a time based on a base time with random jitter
/*let howLong = function( time, jitter ) {
  return time + (Math.rand() % jitter - (jitter/2));
};*/

let addToQueue = function( value ) {
  queue.splice(queue.length, 0, value);
  print(queue[queue.length-1]);
};

let popFromQueue = function() {
  let val = queue[0];
  queue.splice(0, 1);

  return val;
};

// Light up a series of LEDs, with time to signify the both the time to light and time in-between, with jitter to add variability.
// @param lights: an array of LED numbers
// @param flickerIter: the number of flickering iterations
// @param time: The time in milliseconds to light them up
// @param jitter: Add +/- jitter to the above time
let spellIt = function( sequence, flickerIter, time, jitter ) {
  
  addToQueue( Command.SLAVES_OFF );
  addToQueue( Command.FLICKER );
  for ( let i = 0; i < sequence.length; i++ ) {
    addToQueue( sequence[i] );
    addToQueue( Command.ALL_OFF );
  }
  addToQueue( Command.FLICKER );
  addToQueue( Command.SLAVES_RESUME );
  
//  flickerIter = flickerIter || 10;
//  time = time || 1000;
//  jitter = jitter || 500;
  
//  flicker(pin, flickerIter, colors, numPixels * 3);
  
//  Sys.usleep( time * 1000 );
  
//  for ( let i = 0; i < sequence.length; i++ ) { 
//    showOne(sequence[i], howLong( time, jitter), howLong(time, jitter));
//  }
  
//  Sys.usleep( time * 1000 );
  
  //flicker(pin, flickerIter, colors, numPixels * 3);
  
  //Timer.set(1, false, function() { setSlaves(state.on) }, null);
};

// Take the state and make it so, Number Two.
let resolveState = function() {
  if ( state.on ) {
    setSlaves(true);
    setAllPixels();
    strip.show();
  } else {
    setSlaves(false);
    strip.clear();
    strip.show();
  }
};

Timer.set( 1000, true, function() {
  print( '.' );
  if ( processing || queue.length === 0) {
    return;
  }
  
  let letter = popFromQueue();
  print(letter);
  processing = true;
  
  if ( letter === Command.FLICKER ) {
    print('Command.FLICKER');
    flicker(pin, 10, colors, numPixels * 3);
    processing = false;
  } else if ( letter === Command.ALL_OFF ) {
    print('Command.ALL_OFF');
    strip.clear();
    strip.show();
    processing = false;
  } else if ( letter === Command.SLAVES_OFF ) {
    print('Command.SLAVES_OFF');
    setSlaves(false, function(e) { print(e); processing = false; });
  } else if ( letter === Command.SLAVES_RESUME ) {
    print('Command.SLAVES_RESUME');
    setSlaves(state.on, function(e) { print(e); processing = false; });
  } else if ( letter > -1 ) {
    print('letter', letter);
    // Light up a letter
    strip.clear();
    setPixel(letter);
    strip.show();
    processing = false;
  } else {
    print('Unknown: ', letter);
    processing = false;
  }
  
}, null);

// Upon startup, report current actual state, "reported"
// When cloud sends us a command to update state ("desired"), do it
AWS.Shadow.setStateHandler(function(data, event, reported, desired) {
  if (event === AWS.Shadow.CONNECTED) {
    print('AWS.Shadow.CONNECTED');
    AWS.Shadow.update(0, {reported: state});  // Report device state
  } else if (event === AWS.Shadow.UPDATE_DELTA) {
    print('AWS.Shadow.UPDATE_DELTA');
    for (let key in state) {
      if (desired[key] !== undefined) state[key] = desired[key];
    }
    AWS.Shadow.update(0, {reported: state});  // Report device state
    
    resolveState();
  }
  
  print(JSON.stringify(reported), JSON.stringify(desired));
}, null);

let cmd = '';
let args = {};
MQTT.sub('/request', function(conn, topic, msg) {
  print(msg);
  let value = JSON.parse(msg);
  
  cmd = value.cmd;
  args = value.args;
  
  if ( cmd === 'spell' ) {
    //Timer.set( 1, false, function() { setSlaves(false) }, null );
    //Timer.set( 500, false, function() {
      spellIt( args.letters, args.flicker, args.time, args.jitter );
    //}, null);
    
  }
  
}, null);

// Monitor MQTT
MQTT.setEventHandler(function(conn, ev, edata) {
  if ( ev === 0 ) return;
  let evs = '???';
  if ( ev === MQTT.EV_CONNACK ) {
      evs = 'Connected to broker';
			strip.setPixel( 1, 0, 255, 0 );
			strip.show();
			
  } else if ( ev === MQTT.EV_PUBLISH) {
    evs = 'Message published';
  } else if ( ev === MQTT.EV_PUBACK) {
    evs = 'Publish acknowledged';
  } else if ( ev === MQTT.EV_SUBACK ) {
    evs = 'Subscribe acknowledged';
  } else if ( ev === MQTT.EV_UNSUBACK){
    evs = 'Unsubscribe acknowledged';
  } else if ( ev === MQTT.EV_CLOSE) {
    evs = 'Connection to broker was closed';
  }
  print('== MQTT event:', ev, evs);
      
}, null);

// Monitor network connectivity.
Net.setStatusEventHandler(function(ev, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
    strip.setPixel( 0, 255, 255, 0 );
		strip.show();
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
    strip.setPixel( 0, 0, 255, 0 );
		strip.show();
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('== Net event:', ev, evs);
}, null);
