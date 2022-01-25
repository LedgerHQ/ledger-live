import manager from ".";
import { lenseDevices } from "../__tests__/test-helpers/deviceInfos";
test("firmwareUpdateNeedsLegacyBlueResetInstructions", () => {
  lenseDevices([
    "Blue211",
    "NanoS120",
    "NanoS142",
    "NanoS155",
    "NanoX1242rc5",
  ]).forEach(({ deviceInfo, modelId }) => {
    expect(
      manager.firmwareUpdateNeedsLegacyBlueResetInstructions(
        deviceInfo,
        modelId
      )
    ).toBe(false);
  });
});
test("firmwareUpdateWillUninstallApps", () => {
  lenseDevices([
    "Blue211",
    "NanoS120",
    "NanoS142",
    "NanoS155",
    "NanoX1242rc5",
  ]).forEach(({ deviceInfo, modelId }) => {
    expect(manager.firmwareUpdateWillUninstallApps(deviceInfo, modelId)).toBe(
      true
    );
  });
});
test("firmwareUpdateRequiresUserToUninstallApps", () => {
  lenseDevices(["Blue211", "NanoS155", "NanoX1242rc5"]).forEach(
    ({ deviceInfo, modelId }) => {
      expect(
        manager.firmwareUpdateRequiresUserToUninstallApps(modelId, deviceInfo)
      ).toBe(false);
    }
  );
  lenseDevices(["NanoS120", "NanoS142"]).forEach(({ deviceInfo, modelId }) => {
    expect(
      manager.firmwareUpdateRequiresUserToUninstallApps(modelId, deviceInfo)
    ).toBe(true);
  });
});
test("firmwareUnsupported", () => {
  lenseDevices(["Blue211", "NanoS142", "NanoS155", "NanoX1242rc5"]).forEach(
    ({ deviceInfo, modelId }) => {
      expect(manager.firmwareUnsupported(modelId, deviceInfo)).toBe(false);
    }
  );
  lenseDevices(["NanoS120"]).forEach(({ deviceInfo, modelId }) => {
    expect(manager.firmwareUnsupported(modelId, deviceInfo)).toBe(true);
  });
});
