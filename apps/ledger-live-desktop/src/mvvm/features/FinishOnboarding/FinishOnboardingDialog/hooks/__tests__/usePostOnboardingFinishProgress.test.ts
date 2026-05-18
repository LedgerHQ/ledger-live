import { renderHook, waitFor } from "tests/testSetup";
import {
  PostOnboardingActionId,
  type PostOnboardingHubState,
  type StartActionArgs,
} from "@ledgerhq/types-live";
import { usePostOnboardingFinishProgress } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/usePostOnboardingFinishProgress";
import {
  type FinishPostOnboardingListItem,
  getLumenSymbolForActionId,
  resolveFinishPostOnboardingStartAction,
  withFinishDialogActionDescription,
  withFinishDialogActionTitles,
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

describe("usePostOnboardingFinishProgress", () => {
  it("should exclude buyCrypto and attach a Lumen `lumenSymbol` for each action", () => {
    const actionsState = [
      { id: PostOnboardingActionId.deviceOnboarded, completed: true },
      { id: PostOnboardingActionId.buyCrypto, completed: false },
      { id: PostOnboardingActionId.personalizeMock, completed: false },
    ] as PostOnboardingHubState["actionsState"];

    const { result } = renderHook(() => usePostOnboardingFinishProgress(actionsState));

    expect(result.current.actionList.map(a => a.id)).toEqual([
      PostOnboardingActionId.deviceOnboarded,
      PostOnboardingActionId.personalizeMock,
    ]);
    for (const action of result.current.actionList) {
      expect(typeof action.lumenSymbol).toBe("function");
      expect(action.lumenSymbol).toBe(getLumenSymbolForActionId(action.id));
    }
  });

  it("should map list copy to postOnboarding.dialog.actions for known ids", () => {
    const actionsState = [deviceAction, claimAction] as PostOnboardingHubState["actionsState"];
    const { result } = renderHook(() => usePostOnboardingFinishProgress(actionsState));
    const device = result.current.actionList.find(
      a => a.id === PostOnboardingActionId.deviceOnboarded,
    );
    const claim = result.current.actionList.find(a => a.id === PostOnboardingActionId.claimMock);
    expect(device?.title).toBe("postOnboarding.dialog.actions.deviceOnboarded.title");
    expect(claim?.title).toBe(claimAction.title);
  });

  it("should add 1 to stepper completed/total for the implicit first device step (always shown complete)", () => {
    const actionsState = [
      { id: PostOnboardingActionId.personalizeMock, completed: false },
    ] as PostOnboardingHubState["actionsState"];

    const { result } = renderHook(() => usePostOnboardingFinishProgress(actionsState));
    expect(result.current.completedActionsAmount).toBe(1);
    expect(result.current.totalActionsAmount).toBe(2);
  });

  it("should report allActionsCompleted true when the filtered list is empty", () => {
    const { result } = renderHook(() => usePostOnboardingFinishProgress([]));
    expect(result.current.allActionsCompleted).toBe(true);
  });

  it("should report allActionsCompleted true when every listed action is completed", () => {
    const actionsState = [
      { id: PostOnboardingActionId.deviceOnboarded, completed: true },
      { id: PostOnboardingActionId.assetsTransfer, completed: true },
    ] as PostOnboardingHubState["actionsState"];

    const { result } = renderHook(() => usePostOnboardingFinishProgress(actionsState));
    expect(result.current.allActionsCompleted).toBe(true);
  });

  it("should report allActionsCompleted false when at least one listed action is pending", () => {
    const actionsState = [
      { id: PostOnboardingActionId.deviceOnboarded, completed: true },
      { id: PostOnboardingActionId.assetsTransfer, completed: false },
    ] as PostOnboardingHubState["actionsState"];

    const { result } = renderHook(() => usePostOnboardingFinishProgress(actionsState));
    expect(result.current.allActionsCompleted).toBe(false);
  });

  it("should mark an action complete via the async getIsAlreadyCompleted resolver", async () => {
    const actionsState = [
      {
        id: PostOnboardingActionId.recover,
        completed: false,
        getIsAlreadyCompleted: () => Promise.resolve(true),
      },
      { id: PostOnboardingActionId.assetsTransfer, completed: false },
    ] as unknown as PostOnboardingHubState["actionsState"];

    const { result } = renderHook(() => usePostOnboardingFinishProgress(actionsState));

    await waitFor(() => {
      expect(result.current.completionById[PostOnboardingActionId.recover]).toBe(true);
    });
    expect(result.current.completionById[PostOnboardingActionId.assetsTransfer]).toBe(false);
    expect(result.current.completedActionsAmount).toBe(2);
    expect(result.current.totalActionsAmount).toBe(3);
    expect(result.current.allActionsCompleted).toBe(false);
  });

  it("should recompute the list, totals, and allActionsCompleted when actionsState changes", () => {
    const initial = [
      { id: PostOnboardingActionId.assetsTransfer, completed: false },
    ] as PostOnboardingHubState["actionsState"];

    const { result, rerender } = renderHook(
      (actionsState: PostOnboardingHubState["actionsState"]) =>
        usePostOnboardingFinishProgress(actionsState),
      { initialProps: initial },
    );

    expect(result.current.actionList.map(a => a.id)).toEqual([
      PostOnboardingActionId.assetsTransfer,
    ]);
    expect(result.current.totalActionsAmount).toBe(2);
    expect(result.current.completedActionsAmount).toBe(1);
    expect(result.current.allActionsCompleted).toBe(false);

    rerender([
      { id: PostOnboardingActionId.assetsTransfer, completed: true },
      { id: PostOnboardingActionId.syncAccounts, completed: true },
    ] as PostOnboardingHubState["actionsState"]);

    expect(result.current.actionList.map(a => a.id)).toEqual([
      PostOnboardingActionId.assetsTransfer,
      PostOnboardingActionId.syncAccounts,
    ]);
    expect(result.current.totalActionsAmount).toBe(3);
    expect(result.current.completedActionsAmount).toBe(3);
    expect(result.current.allActionsCompleted).toBe(true);
  });
});
