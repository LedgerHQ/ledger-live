import React from "react";
import BigNumber from "bignumber.js";
import { screen } from "@testing-library/react-native";
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
      cosmosResources: { delegations: [] },
    },
  });
  (useBridgeTransaction as jest.Mock).mockReturnValue({
    transaction: { family: "cosmos", mode, recipient: "", validators: [] },
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
