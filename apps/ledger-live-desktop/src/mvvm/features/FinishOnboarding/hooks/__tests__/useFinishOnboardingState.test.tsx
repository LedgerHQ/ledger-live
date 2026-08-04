import React from "react";
import { initialState as postOnboardingInitialState } from "@ledgerhq/live-common/postOnboarding/reducer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import PostOnboardingProviderWrapped from "~/renderer/components/PostOnboardingHub/logic/PostOnboardingProviderWrapped";
import { getLumenSymbolForActionId } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/utils";
import { useFinishOnboardingState } from "../useFinishOnboardingState";

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
}));

const providerWrapper = ({ children }: { children: React.ReactNode }) => (
  <PostOnboardingProviderWrapped>{children}</PostOnboardingProviderWrapped>
);

const withSyncAccountsEnabled = withFlagOverrides({
  lldLedgerSyncEntryPoints: {
    enabled: true,
    params: { postOnboarding: true },
  },
});

describe("useFinishOnboardingState", () => {
  it("should always include the device row as the first completed step", () => {
    const { result } = renderHook(() => useFinishOnboardingState(), {
      wrapper: providerWrapper,
      initialState: {
        postOnboarding: {
          ...postOnboardingInitialState,
          deviceModelId: DeviceModelId.nanoX,
          actionsToComplete: [],
          actionsCompleted: {},
          postOnboardingInProgress: true,
        },
      },
    });

    expect(result.current.steps[0]?.id).toBe(PostOnboardingActionId.deviceOnboarded);
    expect(result.current.steps[0]?.completed).toBe(true);
    expect(result.current.completedStepsAmount).toBe(1);
    expect(result.current.totalStepsAmount).toBe(1);
    expect(result.current.allStepsCompleted).toBe(true);
  });

  it("should exclude buyCrypto from optional steps", () => {
    const { result } = renderHook(() => useFinishOnboardingState(), {
      wrapper: providerWrapper,
      initialState: {
        postOnboarding: {
          ...postOnboardingInitialState,
          deviceModelId: DeviceModelId.nanoX,
          actionsToComplete: [
            PostOnboardingActionId.deviceOnboarded,
            PostOnboardingActionId.buyCrypto,
            PostOnboardingActionId.personalizeMock,
          ],
          actionsCompleted: {
            [PostOnboardingActionId.deviceOnboarded]: true,
            [PostOnboardingActionId.buyCrypto]: false,
            [PostOnboardingActionId.personalizeMock]: false,
          },
          postOnboardingInProgress: true,
        },
      },
    });

    expect(result.current.steps.map(step => step.id)).toEqual([
      PostOnboardingActionId.deviceOnboarded,
      PostOnboardingActionId.personalizeMock,
    ]);
    for (const step of result.current.steps) {
      expect(step.lumenSymbol).toBe(getLumenSymbolForActionId(step.id));
    }
  });

  it("should map known action titles to postOnboarding.dialog.actions keys", () => {
    const { result } = renderHook(() => useFinishOnboardingState(), {
      wrapper: providerWrapper,
      initialState: {
        postOnboarding: {
          ...postOnboardingInitialState,
          deviceModelId: DeviceModelId.nanoX,
          actionsToComplete: [PostOnboardingActionId.assetsTransfer],
          actionsCompleted: { [PostOnboardingActionId.assetsTransfer]: false },
          postOnboardingInProgress: true,
        },
      },
    });

    const assets = result.current.steps.find(
      step => step.id === PostOnboardingActionId.assetsTransfer,
    );
    expect(assets?.title).toBe("postOnboarding.dialog.actions.assetsTransfer.title");
    expect(assets?.description).toBe("postOnboarding.dialog.actions.assetsTransfer.description");
  });

  it("should report allStepsCompleted false when an optional step is pending", () => {
    const { result } = renderHook(() => useFinishOnboardingState(), {
      wrapper: providerWrapper,
      initialState: {
        postOnboarding: {
          ...postOnboardingInitialState,
          deviceModelId: DeviceModelId.nanoX,
          actionsToComplete: [PostOnboardingActionId.personalizeMock],
          actionsCompleted: { [PostOnboardingActionId.personalizeMock]: false },
          postOnboardingInProgress: true,
        },
      },
    });

    expect(result.current.completedStepsAmount).toBe(1);
    expect(result.current.totalStepsAmount).toBe(2);
    expect(result.current.allStepsCompleted).toBe(false);
  });

  it("should report allStepsCompleted true when every optional step is completed", () => {
    const { result } = renderHook(() => useFinishOnboardingState(), {
      wrapper: providerWrapper,
      initialState: {
        ...withSyncAccountsEnabled,
        postOnboarding: {
          ...postOnboardingInitialState,
          deviceModelId: DeviceModelId.nanoX,
          actionsToComplete: [
            PostOnboardingActionId.assetsTransfer,
            PostOnboardingActionId.syncAccounts,
          ],
          actionsCompleted: {
            [PostOnboardingActionId.assetsTransfer]: true,
            [PostOnboardingActionId.syncAccounts]: true,
          },
          postOnboardingInProgress: true,
        },
      },
    });

    expect(result.current.completedStepsAmount).toBe(3);
    expect(result.current.totalStepsAmount).toBe(3);
    expect(result.current.allStepsCompleted).toBe(true);
  });

  it("should mark syncAccounts complete when ledger sync is already active", () => {
    const { result } = renderHook(() => useFinishOnboardingState(), {
      wrapper: providerWrapper,
      initialState: {
        ...withSyncAccountsEnabled,
        postOnboarding: {
          ...postOnboardingInitialState,
          deviceModelId: DeviceModelId.nanoX,
          actionsToComplete: [PostOnboardingActionId.syncAccounts],
          actionsCompleted: { [PostOnboardingActionId.syncAccounts]: false },
          postOnboardingInProgress: true,
        },
        trustchain: {
          trustchain: {
            rootId: "root-id",
            applicationPath: "application-path",
            walletSyncEncryptionKey: "encryption-key",
          },
          memberCredentials: null,
        },
      },
    });

    const syncStep = result.current.steps.find(
      step => step.id === PostOnboardingActionId.syncAccounts,
    );
    expect(syncStep?.completed).toBe(true);
    expect(result.current.completedStepsAmount).toBe(2);
  });
});
