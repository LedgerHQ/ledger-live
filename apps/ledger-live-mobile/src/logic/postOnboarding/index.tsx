import { DeviceModelId } from "@ledgerhq/devices";
import {
  PostOnboardingAction,
  PostOnboardingActionId,
} from "@ledgerhq/types-live";
import { claimMock, migrateAssetsMock, personalizeMock } from "./mockActions";
import { customImageAction } from "./actions";

/**
 * All implemented post onboarding actions.
 */
const postOnboardingActions: Record<
  PostOnboardingActionId,
  PostOnboardingAction
> = {
  claimMock,
  migrateAssetsMock,
  personalizeMock,
  customImage: customImageAction,
};

/**
 * Mock of post onboarding actions for DeviceModelId.nanoFTS
 */
const ftsPostOnboardingActionsMock: PostOnboardingAction[] = [
  claimMock,
  personalizeMock,
  migrateAssetsMock,
];

const ftsPostOnboardingActions: PostOnboardingAction[] = [customImageAction];

export function getPostOnboardingAction(
  id: PostOnboardingActionId,
): PostOnboardingAction {
  return postOnboardingActions[id];
}

/**
 * Returns the list of post onboarding actions for a given device.
 * TODO: keep this updated as we implement feature that we want to add in the
 * post onboarding.
 */
export function getPostOnboardingActionsForDevice(
  deviceModelId: DeviceModelId,
  mock = false,
): PostOnboardingAction[] {
  switch (deviceModelId) {
    case DeviceModelId.nanoS:
      /** Set here the list of actions for the post onboarding of the Nano S */
      return [];
    case DeviceModelId.nanoSP:
      /** Set here the list of actions for the post onboarding of the Nano SP */
      return [];
    case DeviceModelId.nanoX:
      /** Set here the list of actions for the post onboarding of the Nano X */
      return [];
    case DeviceModelId.nanoFTS:
      if (mock) return ftsPostOnboardingActionsMock;
      return ftsPostOnboardingActions;
    default:
      return [];
  }
}
