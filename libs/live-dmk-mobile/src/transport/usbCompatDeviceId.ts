export const USB_COMPAT_DEVICE_ID_PREFIX = "usb|";

export const buildUsbCompatDeviceId = (deviceId: string): string =>
  `${USB_COMPAT_DEVICE_ID_PREFIX}${deviceId}`;

export const isUsbCompatDeviceId = (deviceId: string): boolean =>
  deviceId.startsWith(USB_COMPAT_DEVICE_ID_PREFIX);
