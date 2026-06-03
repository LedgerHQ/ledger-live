import { DeviceModelId } from "@ledgerhq/devices";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { getPostOnboardingAction, getPostOnboardingActionsForDevice } from "../index";

describe("getPostOnboardingActionsForDevice", () => {
  it.each([DeviceModelId.nanoS, DeviceModelId.nanoSP, DeviceModelId.nanoX])(
    "should include discoverWallet for %s",
    deviceModelId => {
      const actions = getPostOnboardingActionsForDevice(deviceModelId);

      expect(actions.some(action => action.id === PostOnboardingActionId.discoverWallet)).toBe(true);
    },
  );

  it.each([DeviceModelId.stax, DeviceModelId.europa, DeviceModelId.apex])(
    "should include discover wallet actions for %s in real and mock lists",
    deviceModelId => {
      const actions = getPostOnboardingActionsForDevice(deviceModelId);
      const mockActions = getPostOnboardingActionsForDevice(deviceModelId, true);

      expect(actions.some(action => action.id === PostOnboardingActionId.discoverWallet)).toBe(
        true,
      );
      expect(
        mockActions.some(action => action.id === PostOnboardingActionId.discoverWalletMock),
      ).toBe(true);
    },
  );

  it("should return discoverWallet from getPostOnboardingAction", () => {
    expect(getPostOnboardingAction(PostOnboardingActionId.discoverWallet)?.id).toBe(
      PostOnboardingActionId.discoverWallet,
    );
  });
});
