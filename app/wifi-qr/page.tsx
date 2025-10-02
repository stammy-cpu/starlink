"use client";

import QRCode from "react-qr-code";

export default function WifiQR() {
  const ssid = "Your_WiFi_Name";
  const password = "Your_WiFi_Password";
  const wifiString = `WIFI:T:WPA;S:${ssid};P:${password};;`;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Scan to Connect Wi-Fi</h1>
      <QRCode value={wifiString} size={220} />
      <p className="mt-4 text-gray-600">{ssid}</p>
    </main>
  );
}
