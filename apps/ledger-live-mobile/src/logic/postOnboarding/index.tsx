import { DeviceModelId } from "@ledgerhq/devices";
import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
import { assetsTransferMock, buyCryptoMock, customImageMock, recoverMock } from "./mockActions";
import { assetsTransferAction, customImageAction, buyCryptoAction, recoverAction } from "./actions";

/**
 * All implemented post onboarding actions.
 */
const postOnboardingActions: { [id in PostOnboardingActionId]?: PostOnboardingAction } = {
  assetsTransferMock,
  buyCryptoMock,
  customImageMock,
  recoverMock,
  customImage: customImageAction,
  assetsTransfer: assetsTransferAction,
  buyCrypto: buyCryptoAction,
  recover: recoverAction,
};

/**
 * Mock of post onboarding actions for DeviceModelId.stax
 */
const staxPostOnboardingActionsMock: PostOnboardingAction[] = [
  assetsTransferMock,
  buyCryptoMock,
  customImageMock,
  recoverMock,
];

const staxPostOnboardingActions: PostOnboardingAction[] = [
  assetsTransferAction,
  buyCryptoAction,
  customImageAction,
  recoverAction,
];

/**
 * Mock of post onboarding actions for DeviceModelId.europa
 */
const europaPostOnboardingActionsMock: PostOnboardingAction[] = [
  assetsTransferMock,
  buyCryptoMock,
  customImageMock,
  recoverMock,
];

const europaPostOnboardingActions: PostOnboardingAction[] = [
  assetsTransferAction,
  buyCryptoAction,
  customImageAction,
  recoverAction,
];

export function getPostOnboardingAction(
  id: PostOnboardingActionId,
): PostOnboardingAction | undefined {
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
    case DeviceModelId.stax:
      if (mock) return staxPostOnboardingActionsMock;
      return staxPostOnboardingActions;
    case DeviceModelId.europa:
      if (mock) return europaPostOnboardingActionsMock;
      return europaPostOnboardingActions;
    default:
      return [];
  }
}
