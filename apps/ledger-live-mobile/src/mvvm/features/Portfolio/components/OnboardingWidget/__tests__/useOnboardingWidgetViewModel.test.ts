import type { Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import BigNumber from "bignumber.js";
import { renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { type Account, PostOnboardingActionId } from "@ledgerhq/types-live";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useOnboardingWidgetViewModel } from "../useOnboardingWidgetViewModel";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index");
jest.mock("~/logic/postOnboarding/useNavigateToPostOnboardingHubCallback", () => ({
  useNavigateToPostOnboardingHubCallback: () => jest.fn(),
}));

const mockedUsePostOnboardingHubState = jest.mocked(usePostOnboardingHubState);

const makeAction = (completed: boolean) => ({
  completed,
  id: "mock" as never,
  Icon: (() => null) as never,
  title: "",
  titleCompleted: "",
});

describe("useOnboardingWidgetViewModel", () => {
  it.each([
    { completed: 0, total: 3, expectedArcStep: 0, expectedTotal: 4, expectedLabel: "1/4" },
    { completed: 1, total: 3, expectedArcStep: 1, expectedTotal: 4, expectedLabel: "2/4" },
    { completed: 2, total: 3, expectedArcStep: 2, expectedTotal: 4, expectedLabel: "3/4" },
    { completed: 3, total: 3, expectedArcStep: 4, expectedTotal: 4, expectedLabel: "4/4" },
    { completed: 0, total: 4, expectedArcStep: 0, expectedTotal: 5, expectedLabel: "1/5" },
  ])(
    "should return stepper currentStep $expectedArcStep, total $expectedTotal, label $expectedLabel when $completed of $total actions completed",
    ({ completed, total, expectedArcStep, expectedTotal, expectedLabel }) => {
      const actions = Array.from({ length: total }, (_, i) => makeAction(i < completed));
      mockedUsePostOnboardingHubState.mockReturnValue({
        deviceModelId: DeviceModelId.nanoX,
        actionsState: actions,
        lastActionCompleted: null,
        postOnboardingInProgress: true,
      });

      const { result } = renderHook(() => useOnboardingWidgetViewModel());

      expect(result.current.currentStep).toBe(expectedArcStep);
      expect(result.current.totalSteps).toBe(expectedTotal);
      expect(result.current.stepperLabel).toBe(expectedLabel);
    },
  );

  it("treats syncAccounts as completed when Ledger Sync is active, matching the hub row", () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.nanoX,
      actionsState: [
        {
          id: PostOnboardingActionId.syncAccounts,
          completed: false,
          getIsAlreadyCompletedByState: ({ isLedgerSyncActive }) => !!isLedgerSyncActive,
          Icon: () => null,
          title: "",
          titleCompleted: "",
        },
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    const minimalTrustchain = {
      rootId: "test-root",
      walletSyncEncryptionKey: "",
      applicationPath: "",
    } as Trustchain;

    const { result } = renderHook(() => useOnboardingWidgetViewModel(), {
      overrideInitialState: s => ({
        ...s,
        trustchain: { ...s.trustchain, trustchain: minimalTrustchain },
      }),
    });

    expect(result.current.totalSteps).toBe(2);
    expect(result.current.stepperLabel).toBe("2/2");
    expect(result.current.currentStep).toBe(2);
  });

  it("treats assets transfer as completed when accounts have a positive balance (hub parity)", () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.nanoX,
      actionsState: [
        {
          id: PostOnboardingActionId.assetsTransfer,
          completed: false,
          getIsAlreadyCompletedByState: ({ accounts }) =>
            !!accounts && accounts.some(account => account?.balance.isGreaterThan(0)),
          Icon: () => null,
          title: "",
          titleCompleted: "",
        },
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    const accountWithFunds = { balance: new BigNumber(1) } as Account;

    const { result } = renderHook(() => useOnboardingWidgetViewModel(), {
      overrideInitialState: s => ({
        ...s,
        accounts: { ...s.accounts, active: [accountWithFunds] },
      }),
    });

    expect(result.current.totalSteps).toBe(2);
    expect(result.current.stepperLabel).toBe("2/2");
    expect(result.current.currentStep).toBe(2);
  });
});
