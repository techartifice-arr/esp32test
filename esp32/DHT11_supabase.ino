#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT11

const char* ssid = "zabai_2026";
const char* password = "zabai_2026";
const char* supabaseUrl = "https://eqpfsmtnmlktwpyqsufg.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcGZzbXRubWxrdHdweXFzdWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTc2ODIsImV4cCI6MjA5MDQzMzY4Mn0.il3LAUrPYuczRM-BJ2Rd0OOUmBvpnTQ61PNMEeCHSlg"
const char* deviceId = "esp32-device-001";

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    delay(10000);
    return;
  }

  Serial.printf("Device: %s  Temp: %.1f °C  Humidity: %.1f %%\n", deviceId, temperature, humidity);

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String endpoint = String(supabaseUrl) + "/rest/v1/readings";
    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", String("Bearer ") + supabaseKey);
    http.addHeader("Prefer", "return=representation");

    String body = "[{";
    body += "\"device_id\": \"" + String(deviceId) + "\",";
    body += "\"temperature\": " + String(temperature, 1) + ",";
    body += "\"humidity\": " + String(humidity, 1);
    body += "}]";

    int httpResponseCode = http.POST(body);
    if (httpResponseCode > 0) {
      Serial.printf("Supabase response: %d\n", httpResponseCode);
      String payload = http.getString();
      Serial.println(payload);
    } else {
      Serial.printf("Error sending data: %d\n", httpResponseCode);
    }
    http.end();
  }

  delay(30000);
}
