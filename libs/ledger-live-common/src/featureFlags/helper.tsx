export function isRecoverDisplayed(feature, deviceModelId) {
  return (
    feature?.enabled &&
    feature?.params?.compatibleDevices?.find(
      (device: { name: string; available: boolean }) =>
        device.name === deviceModelId && device.available,
    )
  );
}
