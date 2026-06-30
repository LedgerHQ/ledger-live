import React from "react";
import { render, withFlagOverrides } from "tests/testSetup";
import { ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";
import TokenRow from "./TokenRow";

const parentAccount = ETH_ACCOUNT_WITH_USDC;
const tokenAccount = ETH_ACCOUNT_WITH_USDC.subAccounts![0];

const assetDiscoverabilityState = withFlagOverrides({
  lwdWallet40: { enabled: true, params: { assetDiscoverability: true } },
});

describe("TokenRow — legacy star visibility", () => {
  const renderRow = (options?: Parameters<typeof render>[1]) =>
    render(
      <TokenRow
        account={tokenAccount}
        parentAccount={parentAccount}
        onClick={jest.fn()}
        range="day"
      />,
      options,
    );

  it("renders the legacy star when asset discoverability is off", () => {
    const { container } = renderRow();
    expect(container.querySelector("#account-star-button")).toBeInTheDocument();
  });

  it("hides the legacy star when asset discoverability is on", () => {
    const { container } = renderRow({ initialState: assetDiscoverabilityState });
    expect(container.querySelector("#account-star-button")).not.toBeInTheDocument();
  });
});
