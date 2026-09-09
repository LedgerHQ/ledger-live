import React from "react";
import { Observable } from "rxjs";
import BigNumber from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AccountLike, SignOperationEvent } from "@ledgerhq/types-live";
import { render, screen, waitFor } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import { ALEO_ACCOUNT_1 } from "../../__mocks__/account.mock";
import { component as BondPublicFlowNavigator } from "../index";

jest.mock(
  "@ledgerhq/live-common/hw/actions/app",
  () => require("../../__mocks__/deviceConnection.mock").hwActionsAppModule,
);
jest.mock(
  "@ledgerhq/live-common/hw/index",
  () => require("../../__mocks__/deviceConnection.mock").hwIndexModule,
);
jest.mock(
  "~/hooks/useIsDeviceLockedPolling/useIsDeviceLockedPolling",
  () => require("../../__mocks__/deviceConnection.mock").deviceLockedPollingModule,
);

jest.mock("~/datadog", () => ({
  isDatadogEnabled: false,
  initializeDatadogProvider: jest.fn(),
  customErrorEventMapper: jest.fn(),
  customActionEventMapper: jest.fn(),
  customLogEventMapper: jest.fn(),
  viewNamePredicate: jest.fn(),
  broadcastLogger: jest.fn(),
}));

const mockUseAleoValidators = jest.fn();
jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  useAleoValidators: (...args: unknown[]) => mockUseAleoValidators(...args),
}));

const mockSignedOperation = {
  signature: "sig",
  operation: {
    id: "op-bond-1",
    hash: "0xbond",
    type: "STAKE" as const,
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: ALEO_ACCOUNT_1.id,
    date: new Date(),
    extra: {},
  },
  expirationDate: undefined,
};

const mockAccountBridge = {
  createTransaction: jest.fn((_account: AccountLike) => ({
    family: "aleo" as const,
    mode: "bond_public",
    amount: new BigNumber(1_000_000),
    recipient: "aleo1figment000",
    useAllAmount: false,
    subAccountId: undefined,
  })),
  updateTransaction: jest.fn((tx: object, patch: object) => ({ ...tx, ...patch })),
  prepareTransaction: async (_account: AccountLike, tx: unknown) => tx,
  getTransactionStatus: async () => ({
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(1000),
    amount: new BigNumber(1_000_000),
    totalSpent: new BigNumber(1_001_000),
  }),
  estimateMaxSpendable: async () => new BigNumber(100_000_000),
  getStuckAccountAndOperation: () => null,
  isAccountEmpty: () => false,
  signOperation: jest.fn(
    () =>
      new Observable<SignOperationEvent>(subscriber => {
        subscriber.next({ type: "device-signature-requested" });
        subscriber.next({ type: "device-signature-granted" });
        subscriber.next({ type: "signed", signedOperation: mockSignedOperation as never });
        subscriber.complete();
      }),
  ),
  broadcast: async ({ signedOperation }: { signedOperation: typeof mockSignedOperation }) =>
    signedOperation.operation,
};

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  __esModule: true,
  getAccountBridge: () =>
    Object.assign(Promise.resolve(mockAccountBridge), {
      status: "fulfilled" as const,
      value: mockAccountBridge,
    }),
  getCurrencyBridge: () => {
    const cb = { preload: () => Promise.resolve(true), hydrate: () => true };
    return Object.assign(Promise.resolve(cb), { status: "fulfilled" as const, value: cb });
  },
}));

const VALIDATOR_ADDRESS = "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t";

const Stack = createNativeStackNavigator();

function BondFlowHarness() {
  return (
    <NotificationsPromptProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={NavigatorName.AleoBondPublicFlow} component={BondPublicFlowNavigator} />
      </Stack.Navigator>
    </NotificationsPromptProvider>
  );
}

const MOCK_VALIDATORS = [
  {
    address: VALIDATOR_ADDRESS,
    name: "Figment",
    isOpen: true,
    isUnbonding: false,
    commissionPercent: 500,
    stakeMicrocredits: 1_000_000_000,
    nonEarningReason: null,
    estimatedYearlyRewardsRate: 0.05,
  },
];

describe("Aleo bond flow (integration)", () => {
  beforeEach(() => {
    mockAccountBridge.createTransaction.mockClear();
    mockAccountBridge.updateTransaction.mockClear();
    mockAccountBridge.signOperation.mockClear();
    mockUseAleoValidators.mockReturnValue({
      validators: MOCK_VALIDATORS,
      loading: false,
      error: null,
    });
  });

  it("navigates Summary → ConnectDevice → ValidationSuccess on the happy path", async () => {
    const { user } = render(<BondFlowHarness />, {
      navigationInitialState: {
        index: 0,
        routes: [
          {
            name: NavigatorName.AleoBondPublicFlow,
            state: {
              index: 0,
              routes: [
                {
                  name: ScreenName.AleoBondPublicSummary,
                  params: {
                    accountId: ALEO_ACCOUNT_1.id,
                    validatorAddress: VALIDATOR_ADDRESS,
                    amount: "1000000",
                  },
                },
              ],
            },
          },
        ],
      },
      overrideInitialState: state => ({
        ...state,
        accounts: { ...state.accounts, active: [ALEO_ACCOUNT_1] },
      }),
    });

    await waitFor(() => expect(screen.getByTestId(/summary-continue-button$/)).toBeVisible());
    await user.press(screen.getByTestId(/summary-continue-button$/));

    const deviceItem = await screen.findByTestId("device-item-mock");
    await user.press(deviceItem);

    await waitFor(() => expect(screen.getByTestId("validate-success-screen")).toBeVisible(), {
      timeout: 10_000,
    });
  }, 30_000);

  it("SelectValidator renders validator list and Continue navigates to Amount", async () => {
    const { user } = render(<BondFlowHarness />, {
      navigationInitialState: {
        index: 0,
        routes: [
          {
            name: NavigatorName.AleoBondPublicFlow,
            state: {
              index: 0,
              routes: [
                {
                  name: ScreenName.AleoBondPublicSelectValidator,
                  params: { accountId: ALEO_ACCOUNT_1.id },
                },
              ],
            },
          },
        ],
      },
      overrideInitialState: state => ({
        ...state,
        accounts: { ...state.accounts, active: [ALEO_ACCOUNT_1] },
      }),
    });

    await waitFor(() => expect(screen.getByText("Figment")).toBeVisible());
    await user.press(screen.getByText("Figment"));
    await user.press(screen.getByText(/continue/i));

    // Amount screen renders the available-balance line
    await waitFor(() => expect(screen.getByText(/available/i)).toBeVisible());
  }, 15_000);

  it("SelectValidator hides the validator list while loading", async () => {
    mockUseAleoValidators.mockReturnValueOnce({ validators: [], loading: true, error: null });

    render(<BondFlowHarness />, {
      navigationInitialState: {
        index: 0,
        routes: [
          {
            name: NavigatorName.AleoBondPublicFlow,
            state: {
              index: 0,
              routes: [
                {
                  name: ScreenName.AleoBondPublicSelectValidator,
                  params: { accountId: ALEO_ACCOUNT_1.id },
                },
              ],
            },
          },
        ],
      },
      overrideInitialState: state => ({
        ...state,
        accounts: { ...state.accounts, active: [ALEO_ACCOUNT_1] },
      }),
    });

    // While loading, no validator names should be shown
    await waitFor(() => expect(screen.queryByText("Figment")).toBeNull());
  }, 10_000);

  it("Amount Continue is disabled when amount is zero", async () => {
    render(<BondFlowHarness />, {
      navigationInitialState: {
        index: 0,
        routes: [
          {
            name: NavigatorName.AleoBondPublicFlow,
            state: {
              index: 0,
              routes: [
                {
                  name: ScreenName.AleoBondPublicAmount,
                  params: { accountId: ALEO_ACCOUNT_1.id, validatorAddress: VALIDATOR_ADDRESS },
                },
              ],
            },
          },
        ],
      },
      overrideInitialState: state => ({
        ...state,
        accounts: { ...state.accounts, active: [ALEO_ACCOUNT_1] },
      }),
    });

    await waitFor(() => expect(screen.getByText(/available/i)).toBeVisible());

    const continueButtons = screen.getAllByText(/continue/i);
    const continueBtn = continueButtons[continueButtons.length - 1];
    expect(continueBtn).toBeDisabled();
  }, 10_000);
});
