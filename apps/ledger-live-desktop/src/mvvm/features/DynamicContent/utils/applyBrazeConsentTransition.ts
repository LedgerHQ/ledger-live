import * as braze from "@braze/web-sdk";
import { type UserId, isDummyUserId } from "@domain/entity-client-identity";
import {
  runBrazeOptInTransition,
  runBrazeOptOutTransition,
  type BrazeIdentityLifecycleSdk,
} from "@ledgerhq/live-common/braze/identityLifecycle";
import { exportDesktopBrazeUserId } from "./brazeIdentity";
import { requireBrazeLifecycleMethod } from "./brazeWebSdkLifecycle";

const webBrazeSdk: BrazeIdentityLifecycleSdk = {
  wipeData: () => requireBrazeLifecycleMethod("wipeData")(),
  enableSDK: () => requireBrazeLifecycleMethod("enableSDK")(),
  changeUser: userId => braze.changeUser(userId),
  refreshContentCards: () => braze.requestContentCardsRefresh(),
};

export const applyBrazeConsentTransition = async (
  {
    isTrackedUser,
    userId,
  }: {
    isTrackedUser: boolean;
    userId: UserId;
  },
  {
    prepareForIdentityTransition,
    refreshContentCards = webBrazeSdk.refreshContentCards,
    enableSDK = webBrazeSdk.enableSDK,
    shouldAbort,
  }: {
    prepareForIdentityTransition?: () => void;
    refreshContentCards?: BrazeIdentityLifecycleSdk["refreshContentCards"];
    enableSDK?: BrazeIdentityLifecycleSdk["enableSDK"];
    shouldAbort?: () => boolean;
  } = {},
): Promise<void> => {
  const isAborted = () => shouldAbort?.() === true;
  if (isDummyUserId(userId) || isAborted()) return;

  prepareForIdentityTransition?.();
  if (isAborted()) return;

  const sdk: BrazeIdentityLifecycleSdk = {
    ...webBrazeSdk,
    enableSDK: async () => {
      if (isAborted()) return;
      await enableSDK();
    },
    changeUser: async changeUserId => {
      if (isAborted()) return;
      await webBrazeSdk.changeUser(changeUserId);
    },
    refreshContentCards: async () => {
      if (isAborted()) return;
      await refreshContentCards();
    },
  };

  if (!isTrackedUser) {
    await runBrazeOptOutTransition(sdk);
    return;
  }

  if (isAborted()) return;

  const brazeUserId = exportDesktopBrazeUserId(userId);
  if (!brazeUserId) return;

  await runBrazeOptInTransition(sdk, {
    userId: brazeUserId,
  });
};
