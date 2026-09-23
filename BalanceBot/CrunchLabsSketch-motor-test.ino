// Simple DRV8835 motor test for the CrunchLabs Balance Bot.
// Upload this sketch to verify that both motors and the driver respond
// without involving the IMU or PID loop.

#define AENBL 5
#define APHASE 7
#define BENBL 6
#define BPHASE 8
#define MODE A3

void stopMotors() {
  analogWrite(AENBL, 0);
  analogWrite(BENBL, 0);
}

void driveBoth(bool forward, int speedValue) {
  digitalWrite(APHASE, forward ? HIGH : LOW);
  digitalWrite(BPHASE, forward ? HIGH : LOW);
  analogWrite(AENBL, speedValue);
  analogWrite(BENBL, speedValue);
}

void setup() {
  Serial.begin(38400);

  pinMode(MODE, OUTPUT);
  pinMode(AENBL, OUTPUT);
  pinMode(BENBL, OUTPUT);
  pinMode(APHASE, OUTPUT);
  pinMode(BPHASE, OUTPUT);

  digitalWrite(MODE, HIGH);
  stopMotors();

  Serial.println("Motor test starting");
}

void loop() {
  Serial.println("Forward 120");
  driveBoth(true, 120);
  delay(2000);

  Serial.println("Stop");
  stopMotors();
  delay(1000);

  Serial.println("Reverse 120");
  driveBoth(false, 120);
  delay(2000);

  Serial.println("Stop");
  stopMotors();
  delay(2000);
}
