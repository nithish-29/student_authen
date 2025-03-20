import serial
import requests
import time

# Adjust port name based on your OS
SERIAL_PORT = "COM12"  # Change to your Arduino port (e.g., "/dev/ttyUSB0" for Linux)
BAUD_RATE = 9600
API_URL = "http://localhost:3000/scan"  # Backend API

# Connect to Arduino
ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
time.sleep(2)  # Wait for Arduino to initialize

print("Listening for RFID scans...")

while True:
    try:
        if ser.in_waiting > 0:
            rfid = ser.readline().decode("utf-8").strip()
            print(f"Scanned RFID: {rfid}")

            # Send RFID data to backend
            response = requests.post(API_URL, json={"rfid": rfid})
            print("Server Response:", response.json())

    except Exception as e:
        print("Error:", e)
