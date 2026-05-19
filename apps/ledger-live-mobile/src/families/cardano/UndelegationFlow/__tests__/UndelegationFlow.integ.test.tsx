import "@ledgerhq/live-common/families/cardano/setup";
import React from "react";
import { render, screen } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { component as UndelegationFlow } from "../index";
import CardanoDelegations from "../../Delegations";
import { server } from "@tests/server";
import BigNumber from "bignumber.js";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { NavigatorName } from "~/const";
import { getCardanoAccountFixture } from "@ledgerhq/coin-cardano/fixtures/accounts";
import { NavigatorScreenParams } from "@react-navigation/native";
import { CardanoUndelegationFlowParamList } from "../types";
import * as useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { http, HttpResponse } from "msw";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";

let mockRewardsValue = new BigNumber("0");
let mockDepositValue = "2000000";

const mockAccount: CardanoAccount = getCardanoAccountFixture({
  delegation: {
    rewards: mockRewardsValue,
    status: true,
    poolId: "00000000000000000000000000000000000000000000000000000001",
    dRepHex: undefined,
    deposit: mockDepositValue,
  },
});
mockAccount.id = "test-cardano-account";
mockAccount.currency.id = "cardano";

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: mockAccount, parentAccount: null }),
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: () => ({
    transaction: {
      family: "cardano",
      mode: "undelegate",
      protocolParams: mockAccount.cardanoResources?.protocolParams,
      amount: new BigNumber(0),
      recipient: "",
      poolId: undefined,
    },
    setTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    account: mockAccount,
    status: {
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber("200000"),
      amount: new BigNumber("0"),
    },
    bridgeError: null,
    bridgePending: false,
  }),
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => {
  const bridge = {
    createTransaction: jest.fn(() => ({
      family: "cardano",
      mode: "undelegate",
      poolId: undefined,
    })),
    updateTransaction: jest.fn((t: object, patch: object) => ({ ...t, ...patch })),
    prepareTransaction: jest.fn((t: unknown) => Promise.resolve(t)),
    getTransactionStatus: jest.fn(() =>
      Promise.resolve({
        errors: {},
        warnings: {},
        estimatedFees: new BigNumber("200000"),
      }),
    ),
  };
  const settledPromise = Object.assign(Promise.resolve(bridge), {
    status: "fulfilled",
    value: bridge,
  });
  return {
    getAccountBridge: jest.fn().mockReturnValue(settledPromise),
  };
});

type RootStackParamList = {
  Delegations: undefined;
  [NavigatorName.CardanoUndelegationFlow]: NavigatorScreenParams<CardanoUndelegationFlowParamList>;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const TestNavigator = () => (
  <QueryClientProvider client={new QueryClient()}>
    <NotificationsPromptProvider>
      <Stack.Navigator initialRouteName="Delegations">
        <Stack.Screen name="Delegations">
          {() => <CardanoDelegations account={mockAccount} />}
        </Stack.Screen>
        <Stack.Screen
          name={NavigatorName.CardanoUndelegationFlow}
          component={UndelegationFlow}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NotificationsPromptProvider>
  </QueryClientProvider>
);

const INITIAL_STATE = {
  overrideInitialState: (state: State) => ({
    ...state,
    accounts: {
      active: [mockAccount],
    },
  }),
};

describe("UndelegationFlow Integration", () => {
  const mockPools = [
    {
      poolId: "a314a18528d00c5fbd067ecb4a212cf2f307c83d2c08f44a11ebebf6",
      name: "Ledger by Figment 1",
      ticker: "LBF1",
      website: "https://www.ledger.com/coin/staking/cardano",
      cost: "170.0",
      margin: "6",
      pledge: "9.82",
      liveStake: "40.22",
      retiredEpoch: 618,
    },
    {
      poolId: "4a9c9902c9538da900b10b716d5d1b214487455fdb06028b32ffa180",
      name: "Ledger by Figment 2",
      ticker: "LBF2",
      website: "https://www.ledger.com/coin/staking/cardano",
      cost: "170.0",
      margin: "6",
      pledge: "9.82",
      liveStake: "91.69",
      retiredEpoch: 618,
    },
  ];

  const handlers = [
    http.get("*/v1/pool/list", () => {
      return HttpResponse.json({
        pageNo: 1,
        limit: 10,
        count: mockPools.length,
        pools: mockPools,
      });
    }),
    http.get("*/v1/pool/detail", () => {
      return HttpResponse.json({
        pools: [mockPools[0]],
      });
    }),
  ];

  beforeEach(() => {
    server.use(...handlers);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should navigate through the full undelegation flow without rewards", async () => {
    mockRewardsValue = new BigNumber("0");
    mockDepositValue = "2000000";
    mockAccount.cardanoResources.delegation = {
      rewards: mockRewardsValue,
      status: true,
      poolId: "00000000000000000000000000000000000000000000000000000001",
      dRepHex: "drep1", // Set DRep to avoid self-tx path
      deposit: mockDepositValue,
      ticker: undefined,
      name: "Test Pool",
    };

    const { user } = render(<TestNavigator />, { ...INITIAL_STATE });

    await screen.findByTestId("cardano-delegation-list");

    const row = await screen.findByTestId("cardano-delegation-row");
    await user.press(row);

    const stopDelegationBtn = await screen.findByText("Undelegate");
    await user.press(stopDelegationBtn);

    await screen.findByTestId("Cardano-Undelegation-Summary");

    expect(screen.getByTestId("undelegation-message")).toBeVisible();
    expect(screen.getByTestId("enabled-delegation-undelegate-continue")).toBeEnabled();
  });

  it("should show self-transaction info drawer when rewards are present with no DRep", async () => {
    mockRewardsValue = new BigNumber("1000000"); // 1 ADA rewards
    mockDepositValue = "2000000";
    mockAccount.cardanoResources.delegation = {
      rewards: mockRewardsValue,
      status: true,
      poolId: "00000000000000000000000000000000000000000000000000000001",
      dRepHex: undefined, // Trigger self-tx path
      deposit: mockDepositValue,
      ticker: undefined,
      name: "Test Pool",
    };

    const { user } = render(<TestNavigator />, { ...INITIAL_STATE });

    await screen.findByTestId("cardano-delegation-list");

    const row = await screen.findByTestId("cardano-delegation-row");
    await user.press(row);

    const stopDelegationBtn = await screen.findByText("Undelegate");
    await user.press(stopDelegationBtn);

    const infoDrawer = await screen.findByTestId("cardano-undelegate-info-drawer");
    expect(infoDrawer).toBeVisible();
  });

  it("should display a network error on summary screen if bridging fails", async () => {
    const spy = jest.spyOn(useBridgeTransaction, "default").mockReturnValue({
      transaction: {
        family: "cardano",
        mode: "undelegate",
        protocolParams: mockAccount.cardanoResources?.protocolParams,
        amount: new BigNumber(0),
        recipient: "",
        poolId: undefined,
      },
      setTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      updateAccount: jest.fn(),
      account: mockAccount,
      parentAccount: null,
      setAccount: jest.fn(),
      status: {
        errors: {},
        warnings: {},
        estimatedFees: new BigNumber("200000"),
        amount: new BigNumber("0"),
        totalSpent: new BigNumber("0"),
      },
      bridgeError: new Error("Undelegation network error"),
      bridgePending: false,
    });

    try {
      mockRewardsValue = new BigNumber("0");
      mockDepositValue = "2000000";
      mockAccount.cardanoResources.delegation = {
        rewards: mockRewardsValue,
        status: true,
        poolId: "00000000000000000000000000000000000000000000000000000001",
        dRepHex: "drep1",
        deposit: mockDepositValue,
        ticker: undefined,
        name: "Test Pool",
      };

      const { user } = render(<TestNavigator />, { ...INITIAL_STATE });

      const row = await screen.findByTestId("cardano-delegation-row");
      await user.press(row);
      const stopDelegationBtn = await screen.findByText("Undelegate");
      await user.press(stopDelegationBtn);

      const errorText = await screen.findByText(/Undelegation network error/i);
      expect(errorText).toBeVisible();
    } finally {
      spy.mockRestore();
    }
  });
});
