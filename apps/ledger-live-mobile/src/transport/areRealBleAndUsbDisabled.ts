import Config from "react-native-config";

/** The mock and e2e builds use Speculos or the mock server, never a real BLE or USB device. */
export const areRealBleAndUsbDisabled = (): boolean => Boolean(Config.MOCK || Config.DETOX);
