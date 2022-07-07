const devices = {
  nanoS: {
    productName: "Nano S",
  },
  nanoX: {
    productName: "Nano X",
  },
  nanoSP: {
    productName: "Nano S Plus",
  },
};

export function deviceById(deviceId: keyof typeof devices) {
  return devices[deviceId];
}
