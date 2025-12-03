import { DeviceModelId } from "@ledgerhq/devices";
import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
import {
  assetsTransferMock,
  buyCryptoMock,
  customImageMock,
  syncAccountsMock,
} from "./mockActions";
import {
  assetsTransferAction,
  customImageAction,
  buyCryptoAction,
  syncAccountsAction,
} from "./actions";

/**
 * All implemented post onboarding actions.
 */
const postOnboardingActions: { [id in PostOnboardingActionId]?: PostOnboardingAction } = {
  assetsTransferMock,
  buyCryptoMock,
  customImageMock,
  syncAccountsMock,
  customImage: customImageAction,
  assetsTransfer: assetsTransferAction,
  buyCrypto: buyCryptoAction,
  syncAccounts: syncAccountsAction,
};

/**
 * Mock of post onboarding actions for DeviceModelId.stax
 */
const staxPostOnboardingActionsMock: PostOnboardingAction[] = [
  assetsTransferMock,
  buyCryptoMock,
  syncAccountsMock,
  customImageMock,
];

const staxPostOnboardingActions: PostOnboardingAction[] = [
  assetsTransferAction,
  buyCryptoAction,
  syncAccountsAction,
  customImageAction,
];

/**
 * Mock of post onboarding actions for DeviceModelId.europa
 */
const europaPostOnboardingActionsMock: PostOnboardingAction[] = [
  assetsTransferMock,
  buyCryptoMock,
  syncAccountsMock,
  customImageMock,
];

const europaPostOnboardingActions: PostOnboardingAction[] = [
  assetsTransferAction,
  buyCryptoAction,
  syncAccountsAction,
  customImageAction,
];

/**
 * Mock of post onboarding actions for DeviceModelId.apex
 */
const apexPostOnboardingActionsMock: PostOnboardingAction[] = [
  assetsTransferMock,
  buyCryptoMock,
  syncAccountsMock,
  customImageMock,
];

const apexPostOnboardingActions: PostOnboardingAction[] = [
  assetsTransferAction,
  buyCryptoAction,
  syncAccountsAction,
  customImageAction,
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
    case DeviceModelId.stax:
      if (mock) return staxPostOnboardingActionsMock;
      return staxPostOnboardingActions;
    case DeviceModelId.europa:
      if (mock) return europaPostOnboardingActionsMock;
      return europaPostOnboardingActions;
    case DeviceModelId.apex:
      if (mock) return apexPostOnboardingActionsMock;
      return apexPostOnboardingActions;

    case DeviceModelId.nanoS:
      // Post-onboarding actions for Nano S (no custom lock screen step).
      return [assetsTransferAction, buyCryptoAction, syncAccountsAction];
    case DeviceModelId.nanoSP:
      // Post-onboarding actions for Nano S Plus (no custom lock screen step).
      return [assetsTransferAction, buyCryptoAction, syncAccountsAction];
    case DeviceModelId.nanoX:
      // Post-onboarding actions for Nano X (no custom lock screen step).
      return [assetsTransferAction, buyCryptoAction, syncAccountsAction];

    default:
      return [];
  }
}

import { DeviceModelId } from "@ledgerhq/devices";
import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
import {
  assetsTransferMock,
  buyCryptoMock,
  customImageMock,
  syncAccountsMock,
} from "./mockActions";
import {
  assetsTransferAction,
  customImageAction,
  buyCryptoAction,
  syncAccountsAction,
} from "./actions";

/**
 * All implemented post onboarding actions.
 */
const postOnboardingActions: { [id in PostOnboardingActionId]?: PostOnboardingAction } = {
  assetsTransferMock,
  buyCryptoMock,
  customImageMock,
  syncAccountsMock,
  customImage: customImageAction,
  assetsTransfer: assetsTransferAction,
  buyCrypto: buyCryptoAction,
  syncAccounts: syncAccountsAction,
};

/**
 * Mock of post onboarding actions for DeviceModelId.stax
 */
const staxPostOnboardingActionsMock: PostOnboardingAction[] = [
  assetsTransferMock,
  buyCryptoMock,
  syncAccountsMock,
  customImageMock,
];

const staxPostOnboardingActions: PostOnboardingAction[] = [
  assetsTransferAction,
  buyCryptoAction,
  syncAccountsAction,
  customImageAction,
];

/**
 * Mock of post onboarding actions for DeviceModelId.europa
 */
const europaPostOnboardingActionsMock: PostOnboardingAction[] = [
  assetsTransferMock,
  buyCryptoMock,
  syncAccountsMock,
  customImageMock,
];

const europaPostOnboardingActions: PostOnboardingAction[] = [
  assetsTransferAction,
  buyCryptoAction,
  syncAccountsAction,
  customImageAction,
];

/**
 * Mock of post onboarding actions for DeviceModelId.apex
 */
const apexPostOnboardingActionsMock: PostOnboardingAction[] = [
  assetsTransferMock,
  buyCryptoMock,
  syncAccountsMock,
  customImageMock,
];

const apexPostOnboardingActions: PostOnboardingAction[] = [
  assetsTransferAction,
  buyCryptoAction,
  syncAccountsAction,
  customImageAction,
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
    case DeviceModelId.stax:
      if (mock) return staxPostOnboardingActionsMock;
      return staxPostOnboardingActions;
    case DeviceModelId.europa:
      if (mock) return europaPostOnboardingActionsMock;
      return europaPostOnboardingActions;
    case DeviceModelId.apex:
      if (mock) return apexPostOnboardingActionsMock;
      return apexPostOnboardingActions;
    case DeviceModelId.nanoS:
      // Post-onboarding actions for Nano S (no custom lock screen step).
      return [assetsTransferAction, buyCryptoAction, syncAccountsAction];
    case DeviceModelId.nanoSP:
      // Post-onboarding actions for Nano S Plus (no custom lock screen step).
      return [assetsTransferAction, buyCryptoAction, syncAccountsAction];
    case DeviceModelId.nanoX:
      // Post-onboarding actions for Nano X (no custom lock screen step).
      return [assetsTransferAction, buyCryptoAction, syncAccountsAction];
    default:
      return [];
  }
}


