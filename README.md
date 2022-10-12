# Indoor Farming Monitoring Device

This branch is for the Indoor Farming Monitoring device. Utilizing DHT11 sensor (temp and humid), LDR (light intensity) and Wemos D1 R2 (in my case) to monitor environmental changes for indoor farming. Instead of using [MQTT](https://mqtt.org/) communication protocol, we're going to use WebSocket provided by [WebThings Framework](https://webthings.io/framework/) to communicate with server.

## Getting Started

* Run  `git clone` to clone this repo
* Connect every sensor needed to the Arduino/Wemos board
* Connect Arduino/Wemos board to your personal computer then open this program to [Arduino IDE](https://www.arduino.cc/en/software)
* Upload the program, open serial monitor. Make sure your board have Wi-Fi capabilities since we're using WebThings framework software and connected to same Wi-Fi as your personal computer
* Write the address showed on serial monitor, and edit [Dashboard](https://github.com/aggggha/indoor-farming-monitoring/tree/main) program to use that address
* That's it!
