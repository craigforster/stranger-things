https://www.youtube.com/watch?v=00Jydc-EVPM

For Halloween this year, I made a “Stranger Things” SMS-controlled interactive Christmas Light display. Guests at the party could SMS their message and watch it spelled out on the lights.

The project was inspired by this Instructable but uses a different chipset for the control. 
http://www.instructables.com/id/Arduino-Based-Stranger-Things-Lights/

At a high level, it uses Twilio for the SMS endpoint. That invokeds an Amazon AWS API Gateway endpoint that triggers a Lambda to put the message on a SQS queue. Once a minute, another Lambda checks for a message on that queue, translates letters to the number in the LED string to show, and sends that over the AWS IoT MQTT topic to the device.

The device is running Mongoose OS on an ESP8266-based chipset. It receives the LED numbers to display, triggers the other lights in the room turn off, runs the flickering sequence, displays the message, flickers again, and turns the lights back on.

The other lights in the room are controlled by a cheap Kankun-based WiFi “smart” outlet, which are super easy to add a HTTP endpoint for local control. “Slaving” it to the device controlling the LEDs allowed for tighter control of when to turn on and off.

The LEDs themselves are a standard WS2811 LED strip, with bulb covers from real Christmas lights and wrapped in green electrical tape to look more like real Christmas lights.

Full write-up coming soon!
