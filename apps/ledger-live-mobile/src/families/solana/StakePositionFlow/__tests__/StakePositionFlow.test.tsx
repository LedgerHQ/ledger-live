import React from "react";
import { View } from "react-native";
import { BigNumber } from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { setEnv } from "@shared/env";
import { track } from "@shared/analytics";
import {
  abandonStakePosition,
  commitStakePosition,
  useShownStakePosition,
  useStakePositionRequester,
  type StakePositionResult,
} from "@features/flow-stake-position";
import {
  NotificationsPromptContext,
  type NotificationsPromptContextValue,
} from "LLM/features/NotificationsPrompt/new/NotificationsPromptProvider";
import { act, render, renderHook, screen } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { component as StakePositionFlow } from "../index";
import { OPERATION_ADDED_WAIT_MS } from "../useSettleOnceOperationAdded";

// The device transport can't run under Jest: the device action hands back the signed operation.
let mockSignedOperation: SignedOperation | null = null;
jest.mock("~/components/DeviceAction", () => ({
  __esModule: true,
  default: ({ renderOnResult }: { renderOnResult?: (payload: unknown) => React.ReactNode }) =>
    mockSignedOperation && renderOnResult
      ? renderOnResult({ signedOperation: mockSignedOperation })
      : null,
}));
jest.mock("~/hooks/deviceActions", () => ({
  useTransactionDeviceAction: () => ({}),
}));

const STAKE_ACCOUNT = "StakeAccount3333333333333333333333333333333";
const HOME = "EarnDashboard";

const generated = genAccount("stake-position-flow-solana", {
  currency: getCryptoCurrencyById("solana"),
  operationsSize: 1,
});
const account: Account = {
  ...generated,
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
};
const broadcastOperation: Operation = {
  ...generated.operations[0],
  id: `${account.id}-stake-position-broadcast`,
  type: "UNDELEGATE",
  accountId: account.id,
};

const exitParams = (requestId: number) => ({
  accountId: account.id,
  transaction: {
    family: "solana" as const,
    mode: "undelegate" as const,
    recipient: STAKE_ACCOUNT,
    amount: new BigNumber(2e9),
  },
  status: {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(5000),
    amount: new BigNumber(2e9),
    totalSpent: new BigNumber(5000),
  },
  requestId,
  action: "deactivate" as const,
  analyticsPropertyFlow: "stake",
});

const connectDevice = (requestId: number) => ({
  name: ScreenName.SolanaStakePositionConnectDevice,
  params: { ...exitParams(requestId), device: { deviceId: "", modelId: "stax", wired: false } },
});

const mockNotifyFlowCompleted = jest.fn();
const notificationsPrompt = {
  notifyFlowCompleted: mockNotifyFlowCompleted,
} as unknown as NotificationsPromptContextValue;

type TestStackParamList = {
  [HOME]: undefined;
  [NavigatorName.SolanaStakePositionFlow]: BaseNavigatorStackParamList[NavigatorName.SolanaStakePositionFlow];
};

const Stack = createNativeStackNavigator<TestStackParamList>();
const Home = () => <View testID="earn-dashboard" />;

type FlowRoute = Readonly<{ name: ScreenName; params: object }>;

function renderFlow(routes: FlowRoute[]) {
  return render(
    <NotificationsPromptContext.Provider value={notificationsPrompt}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={HOME} component={Home} />
        <Stack.Screen name={NavigatorName.SolanaStakePositionFlow} component={StakePositionFlow} />
      </Stack.Navigator>
    </NotificationsPromptContext.Provider>,
    {
      navigationInitialState: {
        index: 1,
        routes: [
          { name: HOME },
          {
            name: NavigatorName.SolanaStakePositionFlow,
            // No `screen`: it would reset the stack below to that one route.
            params: { params: routes[0].params },
            state: { index: routes.length - 1, routes },
          },
        ],
      },
      overrideInitialState: (state: State): State => ({
        ...state,
        accounts: { ...state.accounts, active: [account] },
      }),
    },
  );
}

/** A request the stake position sheet handed off to the device screens. */
function handedOffRequest() {
  const host = renderHook(() => ({
    request: useStakePositionRequester("earn"),
    shown: useShownStakePosition("earn"),
  }));
  let answer: Promise<StakePositionResult> = Promise.resolve({ action: null });
  act(() => {
    answer = host.result.current.request({
      accountId: account.id,
      positionId: STAKE_ACCOUNT,
      validatorAddress: "FigmentVote1111111111111111111111111111111",
    });
  });
  const requestId = host.result.current.shown.request?.id ?? -1;
  act(() => commitStakePosition(requestId));
  return { answer, requestId, host };
}

const isPending = async (answer: Promise<unknown>) => {
  let isSettled = false;
  void answer.then(() => {
    isSettled = true;
  });
  await act(async () => {
    await Promise.resolve();
  });
  return !isSettled;
};

describe("SolanaStakePositionFlow", () => {
  beforeAll(() => setEnv("DISABLE_TRANSACTION_BROADCAST", true));
  afterAll(() => setEnv("DISABLE_TRANSACTION_BROADCAST", false));

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignedOperation = null;
  });

  afterEach(() => {
    const { result, unmount } = renderHook(() => useShownStakePosition());
    const id = result.current.request?.id;
    if (id !== undefined) abandonStakePosition(id);
    unmount();
  });

  it("should answer the live app only once the account holds the broadcast operation", async () => {
    mockSignedOperation = { signature: "signature", operation: broadcastOperation };
    const { answer, requestId } = handedOffRequest();
    const events: string[] = [];
    void answer.then(() => events.push("answered"));
    const { store } = renderFlow([connectDevice(requestId)]);
    const unsubscribe = store.subscribe(() => {
      const held = store
        .getState()
        .accounts.active[0]?.pendingOperations.some(({ id }) => id === broadcastOperation.id);
      if (held && !events.includes("operation added")) events.push("operation added");
    });

    expect(await screen.findByTestId("validate-success-screen")).toBeVisible();
    expect(screen.getByText("Deactivation submitted")).toBeVisible();
    // Far below the fallback wait: the answer can only come from the operation being added.
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(await isPending(answer)).toBe(false);
    expect(events).toEqual(["operation added", "answered"]);
    expect(track).not.toHaveBeenCalledWith("staking_completed", expect.anything());
    unsubscribe();
  });

  it("should answer the live app anyway when the operation never shows in the account", async () => {
    const { answer, requestId } = handedOffRequest();
    renderFlow([
      {
        name: ScreenName.SolanaStakePositionValidationSuccess,
        params: {
          accountId: account.id,
          requestId,
          action: "deactivate",
          result: broadcastOperation,
        },
      },
    ]);

    act(() => jest.advanceTimersByTime(OPERATION_ADDED_WAIT_MS - 1));
    expect(await isPending(answer)).toBe(true);

    act(() => jest.advanceTimersByTime(1));
    await expect(answer).resolves.toEqual({ action: "deactivate" });
  });

  it("should close the device screens from the success and prompt for notifications", async () => {
    const { answer, requestId, host } = handedOffRequest();
    const { user } = renderFlow([
      {
        name: ScreenName.SolanaStakePositionValidationSuccess,
        params: {
          accountId: account.id,
          requestId,
          action: "withdraw",
          result: broadcastOperation,
        },
      },
    ]);
    expect(screen.getByText("Withdrawal submitted")).toBeVisible();

    await user.press(screen.getByTestId("enabled-success-close-button"));

    await expect(answer).resolves.toEqual({ action: "withdraw" });
    expect(screen.getByTestId("earn-dashboard")).toBeVisible();
    expect(mockNotifyFlowCompleted).toHaveBeenCalledWith("stake");
    expect(host.result.current.shown.phase).toBe("closed");
  });

  it("should answer null when the user closes the error", async () => {
    const { answer, requestId } = handedOffRequest();
    const { user } = renderFlow([
      connectDevice(requestId),
      {
        name: ScreenName.SolanaStakePositionValidationError,
        params: { requestId, error: new Error("broadcast failed") },
      },
    ]);

    await user.press(screen.getByTestId("SendErrorClose"));

    await expect(answer).resolves.toEqual({ action: null });
    expect(screen.getByTestId("earn-dashboard")).toBeVisible();
    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
  });

  it("should go back to the device step from the error without answering", async () => {
    const { answer, requestId } = handedOffRequest();
    const { user } = renderFlow([
      connectDevice(requestId),
      {
        name: ScreenName.SolanaStakePositionValidationError,
        params: { requestId, error: new Error("broadcast failed") },
      },
    ]);

    await user.press(screen.getByText("Retry"));

    expect(screen.queryByText("Retry")).toBeNull();
    expect(screen.getAllByText("Connect device")[0]).toBeVisible();
    expect(await isPending(answer)).toBe(true);
  });

  it("should answer null when the device screens are left without a result", async () => {
    const { answer, requestId } = handedOffRequest();
    const { unmount } = renderFlow([connectDevice(requestId)]);

    unmount();

    await expect(answer).resolves.toEqual({ action: null });
  });

  it("should keep the suffixes the generic device screens derive their routes from", () => {
    expect([
      ScreenName.SolanaStakePositionSelectDevice,
      ScreenName.SolanaStakePositionConnectDevice,
      ScreenName.SolanaStakePositionValidationSuccess,
      ScreenName.SolanaStakePositionValidationError,
    ]).toEqual([
      expect.stringMatching(/SelectDevice$/),
      expect.stringMatching(/ConnectDevice$/),
      expect.stringMatching(/ValidationSuccess$/),
      expect.stringMatching(/ValidationError$/),
    ]);
    expect(
      ScreenName.SolanaStakePositionSelectDevice.replace("SelectDevice", "ConnectDevice"),
    ).toBe(ScreenName.SolanaStakePositionConnectDevice);
    expect(
      ScreenName.SolanaStakePositionConnectDevice.replace("ConnectDevice", "ValidationSuccess"),
    ).toBe(ScreenName.SolanaStakePositionValidationSuccess);
  });
});
