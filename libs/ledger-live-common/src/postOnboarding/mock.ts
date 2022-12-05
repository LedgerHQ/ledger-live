/** mocks for unit tests */

import {
  FeatureId,
  PostOnboardingAction,
  PostOnboardingActionId,
} from "@ledgerhq/types-live";

const MockIcon = (): null => null;

export const mockedFeatureIdToTest: FeatureId = "mockFeature";

export const claimTestMock: PostOnboardingAction = {
  id: PostOnboardingActionId.claimMock,
  Icon: MockIcon,
  title: "Claim my NFT",
  description: "A special NFT for you.",
  tagLabel: "Free",
  actionCompletedPopupLabel: "NFT claimed",
  actionCompletedHubTitle: "Kickstart your Web3 journey.",
  navigationParams: [],
};

export const personalizeTestMock: PostOnboardingAction = {
  id: PostOnboardingActionId.personalizeMock,
  Icon: MockIcon,
  featureFlagId: mockedFeatureIdToTest,
  title: `Personalize my device`,
  description: "By customizing the screen.",
  actionCompletedPopupLabel: "Device personalized",
  actionCompletedHubTitle: "That screen is looking neat.",
  navigationParams: [],
};

export const migrateAssetsTestMock: PostOnboardingAction = {
  id: PostOnboardingActionId.migrateAssetsMock,
  Icon: MockIcon,
  title: "Transfer assets to my Ledger",
  description: "Easily secure assets from coinbase or another exchange.",
  actionCompletedPopupLabel: "Assets transfered",
  actionCompletedHubTitle: "Something about being a crypto pro.",
  navigationParams: [],
};

export function getPostOnboardingAction(
  id: PostOnboardingActionId
): PostOnboardingAction {
  return {
    [PostOnboardingActionId.claimMock]: claimTestMock,
    [PostOnboardingActionId.personalizeMock]: personalizeTestMock,
    [PostOnboardingActionId.migrateAssetsMock]: migrateAssetsTestMock,
  }[id];
}
