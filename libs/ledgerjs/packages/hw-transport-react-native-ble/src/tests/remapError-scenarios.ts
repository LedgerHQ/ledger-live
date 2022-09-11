export default [
  // Nb don't know how else to check the mapped class without depending on the erros themselves :thinking:
  [
    "cant-open-device",
    {
      code: "cant-open-device",
    },
    "CantOpenDevice: CantOpenDevice",
  ],
  [
    "pairing-failed",
    {
      code: "pairing-failed",
    },
    "PairingFailed: PairingFailed",
  ],
  [
    "bluetooth-required",
    {
      code: "bluetooth-required",
    },
    "BluetoothRequired: BluetoothRequired",
  ],
  [
    "generic error maps to TransportError, keeping original error",
    {
      code: "Something else",
    },
    "TransportError: Something else",
  ],
];
