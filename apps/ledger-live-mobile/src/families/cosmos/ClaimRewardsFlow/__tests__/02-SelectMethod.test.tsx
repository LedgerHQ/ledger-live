import React from "react";
import BigNumber from "bignumber.js";
import { screen, fireEvent } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { ScreenName } from "~/const";
import ClaimRewardsMethod from "../02-SelectMethod";

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

function setup(
  currencyId: string,
  mode: string,
  status: Record<string, unknown> = { errors: {}, warnings: {} },
) {
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
    status,
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

describe("Cosmos ClaimRewards SelectMethod device handoff", () => {
  beforeEach(() => jest.clearAllMocks());

  it("forwards the transaction status to CosmosClaimRewardsSelectDevice on continue", () => {
    const sentinelStatus = {
      errors: {},
      warnings: {},
      estimatedFees: BigNumber(42),
      amount: BigNumber(1000),
      __sentinel: "cosmos-claim-rewards-status",
    };
    setup("cosmos", "claimReward", sentinelStatus);
    render(<ClaimRewardsMethod navigation={navigation} route={route} />);

    fireEvent.press(screen.getByText("Continue"));

    expect(navigation.navigate).toHaveBeenCalledWith(
      ScreenName.CosmosClaimRewardsSelectDevice,
      expect.objectContaining({ status: sentinelStatus }),
    );
  });
});
