#include <DHT.h>
#include <DHT_U.h>
#include <Arduino.h>
#include "Thing.h"
#include "WebThingAdapter.h"

// Hostname used by mDNS
const String mDNSHostname = "IoT Sensor";

// TODO: Hardcode your wifi credentials here (and keep it private)
const char *ssid = "Another Secure Network";
const char *password = "kmzwa88SAA";

// Library to communicate with sensor
DHT dht(D5, DHT11);

// Handle connection betweeen Thing and Gateway (in case we use Gateway)
WebThingAdapter *adapter;

// @type members: Capabilities supported by Thing
// See schemas: https://iot.mozilla.org/schemas#capabilities
const char *tempAndHumidTypes[] = {"TempAndHumid", "Sensor", nullptr};
const char *LDRTypes[] = {"MultiLevel", "Sensor", nullptr};

// Thing description section
// ThingDevice device(id, title, types)
// id: Unique identifier for Thing (part of URL: http://<IP>/thing/<id>)
// title: String that shows ip in Gateway for the Thing
// types: array of @types
ThingDevice sensor("DHT11", "DHT11 Humidity and Air Temperature Sensor", tempAndHumidTypes);
ThingDevice ldr("LDR", "Simple Light Intensity Sensor", LDRTypes);

// Define one or more properties supported by Thing
// ThingProperty property(id, desc, type, attrType)
// id: Unique identifier for property
// types: NO_STATE, BOOLEAN, NUMBER, or STRING
// attrtype: property @type (https://iot.mozilla.org/schemas#properties
ThingProperty sensorTemp("temperature", "", NUMBER, "TempProperty");
ThingProperty sensorHumid("humidity", "", NUMBER, "HumidProperty");
ThingProperty sensorLDR("intensity", "", NUMBER, "IntensityProperty");

void setup(void) {
  Serial.begin(115200);

  // Sensor and output related
  dht.begin();

  Serial.print("Connecting to \"");
  Serial.print(ssid);
  Serial.print("\"");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.println();

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Connected to ");
  Serial.println(ssid);
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Create new WebThings connection handle (default port: 80)
  adapter = new WebThingAdapter(mDNSHostname, WiFi.localIP());

  // Set unit for properties
  sensorTemp.unit = "C";
  sensorHumid.unit = "%";
  sensorLDR.unit = "%";

  // Associate properties with device
  sensor.addProperty(&sensorTemp);
  sensor.addProperty(&sensorHumid);
  ldr.addProperty(&sensorLDR);

  // Associate device with connection
  adapter->addDevice(&sensor);
  adapter->addDevice(&ldr);

  // Start mDNS and HTTP server
  adapter->begin();
  Serial.println("HTTP server started");
  Serial.print("http://");
  Serial.print(WiFi.localIP());
  Serial.print("/things/");
  Serial.print(sensor.id);
  Serial.println();
  Serial.print("http://");
  Serial.print(WiFi.localIP());
  Serial.print("/things/");
  Serial.print(ldr.id);

  // LED initial value
  // ThingPropertyValue initLEDState;
  // initLEDState.boolean = false;
  // ledOnOff.setValue(initLEDState);
}

void loop(void) {
  ThingPropertyValue tempValue, humidValue, intensityValue;
  float temp, humid, intensity;
  // bool state;

  // Read sensor values
  temp = dht.readTemperature();
  humid = dht.readHumidity();
  intensity = analogRead(A0);

  // Temp value
  tempValue.number = temp;
  sensorTemp.setValue(tempValue);

  // Humid value
  humidValue.number = humid;
  sensorHumid.setValue(humidValue);

  // Light intensity value
  intensityValue.number = intensity;
  sensorLDR.setValue(intensityValue);

  adapter->update();
  delay(3000);
}
