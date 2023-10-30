// Recover compatibility check function, based on feature and device
export function checkRecoverCompatibility(feature, deviceModelId) {
  return (
    feature?.enabled &&
    feature?.params?.compatibleDevices?.find(
      (device: { name: string; available: boolean }) =>
        device.name === deviceModelId && device.available,
    )
  );
}
