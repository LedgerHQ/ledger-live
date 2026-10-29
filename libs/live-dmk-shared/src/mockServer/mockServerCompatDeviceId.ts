export const MOCK_SERVER_COMPAT_DEVICE_ID_PREFIX = "mockserver|";

export const buildMockServerCompatDeviceId = (deviceId: string): string =>
  `${MOCK_SERVER_COMPAT_DEVICE_ID_PREFIX}${deviceId}`;

export const isMockServerCompatDeviceId = (deviceId: string): boolean =>
  deviceId.startsWith(MOCK_SERVER_COMPAT_DEVICE_ID_PREFIX);

export const getMockServerDeviceIdFromCompatId = (compatDeviceId: string): string =>
  compatDeviceId.slice(MOCK_SERVER_COMPAT_DEVICE_ID_PREFIX.length);
