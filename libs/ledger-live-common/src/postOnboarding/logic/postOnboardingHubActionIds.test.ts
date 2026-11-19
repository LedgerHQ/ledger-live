import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
import { postOnboardingHubActionIds } from "./postOnboardingHubActionIds";

const action = (
  id: PostOnboardingActionId,
  featureFlagId?: PostOnboardingAction["featureFlagId"],
): PostOnboardingAction => ({
  id,
  featureFlagId,
  Icon: () => null,
  title: id,
  titleCompleted: id,
  getNavigationParams: () => [undefined],
});

const assetsTransfer = action(PostOnboardingActionId.assetsTransfer);
const recover = action(PostOnboardingActionId.recover);
const flagged = action(PostOnboardingActionId.syncAccounts, "llmLedgerSyncEntryPoints");

describe("postOnboardingHubActionIds", () => {
  it("should keep a deferred Recover action when the hub would hide it", () => {
    const ids = postOnboardingHubActionIds({
      actions: [assetsTransfer, recover],
      isFlagEnabled: () => true,
      canShowRecover: false,
      queuedActionIds: [PostOnboardingActionId.recover],
      completedActionIds: { [PostOnboardingActionId.recover]: false },
    });

    expect(ids).toEqual([PostOnboardingActionId.assetsTransfer, PostOnboardingActionId.recover]);
  });

  it("should keep a deferred Recover action when the device catalog has none", () => {
    const ids = postOnboardingHubActionIds({
      actions: [assetsTransfer],
      isFlagEnabled: () => true,
      canShowRecover: false,
      queuedActionIds: [PostOnboardingActionId.recover],
      completedActionIds: {},
    });

    expect(ids).toEqual([PostOnboardingActionId.assetsTransfer, PostOnboardingActionId.recover]);
  });

  it("should leave Recover out when nobody deferred it", () => {
    const ids = postOnboardingHubActionIds({
      actions: [assetsTransfer, recover],
      isFlagEnabled: () => true,
      canShowRecover: false,
      queuedActionIds: [],
      completedActionIds: {},
    });

    expect(ids).toEqual([PostOnboardingActionId.assetsTransfer]);
  });

  it("should leave a completed Recover action out of a new hub", () => {
    const ids = postOnboardingHubActionIds({
      actions: [assetsTransfer],
      isFlagEnabled: () => true,
      canShowRecover: false,
      queuedActionIds: [PostOnboardingActionId.recover],
      completedActionIds: { [PostOnboardingActionId.recover]: true },
    });

    expect(ids).toEqual([PostOnboardingActionId.assetsTransfer]);
  });

  it("should include Recover once when the hub is allowed to show it", () => {
    const ids = postOnboardingHubActionIds({
      actions: [assetsTransfer, recover],
      isFlagEnabled: () => true,
      canShowRecover: true,
      queuedActionIds: [PostOnboardingActionId.recover],
      completedActionIds: { [PostOnboardingActionId.recover]: false },
    });

    expect(ids).toEqual([PostOnboardingActionId.assetsTransfer, PostOnboardingActionId.recover]);
  });

  it("should drop an action whose feature flag is off", () => {
    const ids = postOnboardingHubActionIds({
      actions: [assetsTransfer, flagged],
      isFlagEnabled: () => false,
      canShowRecover: false,
      queuedActionIds: [],
      completedActionIds: {},
    });

    expect(ids).toEqual([PostOnboardingActionId.assetsTransfer]);
  });
});
