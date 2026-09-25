import React from "react";
import BigNumber from "bignumber.js";
import { screen, fireEvent } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import ClaimRewardsMethod from "./02-SelectMethod";

// Mock only external deps (bridge/tx/account hooks, navigation theme); the mode toggle and
// the rest of the screen render for real so we assert on the actual user-visible label.
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useTheme: () => ({
    colors: { background: "#fff", grey: "#999", live: "#0af", white: "#fff" },
  }),
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({}),
    updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  }),
}));
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction");
jest.mock("LLM/hooks/useAccountScreen");
jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "ATOM", name: "Cosmos", magnitude: 6 }),
}));

type Props = React.ComponentProps<typeof ClaimRewardsMethod>;

const route = {
  key: "k",
  name: "CosmosClaimRewardsMethod",
  params: {
    accountId: "acc",
    validator: { validatorAddress: "cosmosvaloper1x", name: "Val" },
    value: BigNumber(1000),
  },
} as unknown as Props["route"];
const navigation = { navigate: jest.fn() } as unknown as Props["navigation"];

function setup(currencyId: string, mode: string) {
  (useAccountScreen as jest.Mock).mockReturnValue({
    account: {
      type: "Account",
      freshAddress: "cosmos1test",
      currency: getCryptoCurrencyById(currencyId),
      stakingResources: { delegations: [] },
    },
  });
  (useBridgeTransaction as jest.Mock).mockReturnValue({
    transaction: { family: "cosmos", mode, recipient: "" },
    status: { errors: {}, warnings: {} },
    updateTransaction: jest.fn(),
  });
}

describe("Cosmos ClaimRewards SelectMethod compound gating", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the compound option on a standard cosmos chain", () => {
    setup("cosmos", "claimReward");
    render(<ClaimRewardsMethod navigation={navigation} route={route} />);
    expect(screen.getByText("Compound")).toBeVisible();
  });

  it("hides the compound option on an epoching chain (babylon)", () => {
    setup("babylon", "claimReward");
    render(<ClaimRewardsMethod navigation={navigation} route={route} />);
    expect(screen.queryByText("Compound")).toBeNull();
  });
});

describe("Cosmos ClaimRewards SelectMethod transaction shape", () => {
  beforeEach(() => jest.clearAllMocks());

  it("builds the initial transaction with mode, a set valAddress, and a non-zero amount", () => {
    setup("cosmos", "claimReward");
    render(<ClaimRewardsMethod navigation={navigation} route={route} />);
    // route.params carries no `transaction`, so the component builds one from scratch on mount.
    const initializer = (useBridgeTransaction as jest.Mock).mock.calls[0][1];
    const { transaction } = initializer();
    expect(transaction).toMatchObject({
      mode: "claimReward",
      valAddress: "cosmosvaloper1x",
    });
    expect((transaction.amount as BigNumber).isZero()).toBe(false);
  });

  it("switches the mode to compoundReward without losing valAddress/amount", () => {
    const updateTransaction = jest.fn();
    (useAccountScreen as jest.Mock).mockReturnValue({
      account: {
        type: "Account",
        freshAddress: "cosmos1test",
        currency: getCryptoCurrencyById("cosmos"),
        stakingResources: { delegations: [] },
      },
    });
    (useBridgeTransaction as jest.Mock).mockReturnValue({
      transaction: {
        family: "cosmos",
        mode: "claimReward",
        recipient: "",
        valAddress: "cosmosvaloper1x",
        amount: BigNumber(1000),
      },
      status: { errors: {}, warnings: {} },
      updateTransaction,
    });
    render(<ClaimRewardsMethod navigation={navigation} route={route} />);
    fireEvent.press(screen.getByText("Compound"));
    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updater = updateTransaction.mock.calls[0][0];
    const result = updater();
    expect(result).toMatchObject({ mode: "compoundReward", valAddress: "cosmosvaloper1x" });
    expect((result.amount as BigNumber).isZero()).toBe(false);
  });
});
