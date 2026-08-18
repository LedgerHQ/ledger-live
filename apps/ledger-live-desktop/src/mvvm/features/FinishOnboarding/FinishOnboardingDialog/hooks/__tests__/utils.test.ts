import {
  PostOnboardingActionId,
  type PostOnboardingHubState,
  type StartActionArgs,
} from "@ledgerhq/types-live";
import {
  getLumenSymbolForActionId,
  resolveFinishPostOnboardingStartAction,
  withFinishDialogActionDescription,
  withFinishDialogActionTitles,
  type FinishPostOnboardingListItem,
} from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/utils";

const deviceAction = {
  id: PostOnboardingActionId.deviceOnboarded,
  title: "postOnboarding.actions.deviceOnboarded.title",
  titleCompleted: "postOnboarding.actions.deviceOnboarded.titleCompleted",
  description: "legacy",
  completed: true,
} as PostOnboardingHubState["actionsState"][number];

const assetsAction = {
  id: PostOnboardingActionId.assetsTransfer,
  title: "postOnboarding.actions.assetsTransfer.title",
  titleCompleted: "postOnboarding.actions.assetsTransfer.titleCompleted",
  description: "postOnboarding.actions.assetsTransfer.description",
  completed: false,
} as PostOnboardingHubState["actionsState"][number];

const claimAction = {
  id: PostOnboardingActionId.claimMock,
  title: "Claim my NFT",
  titleCompleted: "Claim my NFT",
  description: "A special NFT for you.",
  completed: false,
} as PostOnboardingHubState["actionsState"][number];

describe("resolveFinishPostOnboardingStartAction", () => {
  it("should return the hub startAction when defined, or a no-op", () => {
    const startAction = (args: StartActionArgs) => {
      void args;
    };
    const withStart = {
      id: PostOnboardingActionId.deviceOnboarded,
      completed: true,
      lumenSymbol: getLumenSymbolForActionId(PostOnboardingActionId.deviceOnboarded),
      startAction,
    } as FinishPostOnboardingListItem;
    expect(resolveFinishPostOnboardingStartAction(withStart)).toBe(startAction);

    const noStart = {
      id: PostOnboardingActionId.claimMock,
      completed: false,
      lumenSymbol: getLumenSymbolForActionId(PostOnboardingActionId.claimMock),
    } as unknown as FinishPostOnboardingListItem;
    const noop = resolveFinishPostOnboardingStartAction(noStart);
    expect(() => noop({} as StartActionArgs)).not.toThrow();
  });
});

describe("withFinishDialogActionTitles / withFinishDialogActionDescription", () => {
  it("should replace title with postOnboarding.dialog.actions keys and descriptions where defined", () => {
    const titled = withFinishDialogActionTitles(deviceAction);
    expect(titled.title).toBe("postOnboarding.dialog.actions.deviceOnboarded.title");
    expect(titled.titleCompleted).toBe(deviceAction.titleCompleted);
    const afterDesc = withFinishDialogActionDescription(titled);
    expect(afterDesc.description).toBe("legacy");

    const assetsTitled = withFinishDialogActionTitles(assetsAction);
    expect(assetsTitled.title).toBe("postOnboarding.dialog.actions.assetsTransfer.title");
    const full = withFinishDialogActionDescription(assetsTitled);
    expect(full.description).toBe("postOnboarding.dialog.actions.assetsTransfer.description");

    expect(claimAction.title).toBe(withFinishDialogActionTitles(claimAction).title);
  });
});
