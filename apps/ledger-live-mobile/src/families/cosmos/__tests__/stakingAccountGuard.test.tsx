import React from "react";
import BigNumber from "bignumber.js";
import { render } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { ScreenName } from "~/const";
import AccountBalanceFooter from "../AccountBalanceSummaryFooter";
import CosmosDelegations from "../Delegations";
import RedelegationSelectValidator from "../RedelegationFlow/01-SelectValidator";

jest.mock("LLM/hooks/useAccountScreen");
jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "ATOM", name: "Cosmos", magnitude: 6 }),
}));
jest.mock("@ledgerhq/live-common/config/index", () => ({
  getCurrencyConfiguration: () => ({}),
}));

const accountWithoutStaking = {
  type: "Account",
  id: "acc",
  freshAddress: "cosmos1test",
  currency: getCryptoCurrencyById("cosmos"),
  balance: new BigNumber(1),
  spendableBalance: new BigNumber(1),
} as unknown as CosmosAccount;

describe("cosmos staking account guard", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("AccountBalanceSummaryFooter throws for an account without stakingResources", () => {
    expect(() => render(<AccountBalanceFooter account={accountWithoutStaking} />)).toThrow(
      "cosmos staking account required",
    );
  });

  it("Delegations throws for an account without stakingResources", () => {
    expect(() => render(<CosmosDelegations account={accountWithoutStaking} />)).toThrow(
      "cosmos staking account required",
    );
  });

  it("RedelegationSelectValidator throws for an account without stakingResources", () => {
    jest.mocked(useAccountScreen).mockReturnValue({
      account: accountWithoutStaking,
      parentAccount: undefined,
    } as unknown as ReturnType<typeof useAccountScreen>);
    const route = {
      key: "k",
      name: ScreenName.CosmosRedelegationValidator,
      params: { accountId: "acc" },
    } as unknown as React.ComponentProps<typeof RedelegationSelectValidator>["route"];
    const navigation = { navigate: jest.fn() } as unknown as React.ComponentProps<
      typeof RedelegationSelectValidator
    >["navigation"];

    expect(() =>
      render(<RedelegationSelectValidator navigation={navigation} route={route} />),
    ).toThrow("cosmos staking account required");
  });
});
