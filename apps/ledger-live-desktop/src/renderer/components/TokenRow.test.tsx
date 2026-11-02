import React from "react";
import { render } from "tests/testSetup";
import { ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";
import TokenRow from "./TokenRow";

const parentAccount = ETH_ACCOUNT_WITH_USDC;
const tokenAccount = ETH_ACCOUNT_WITH_USDC.subAccounts![0];

describe("TokenRow", () => {
  it("does not render the legacy star", () => {
    const { container } = render(
      <TokenRow
        account={tokenAccount}
        parentAccount={parentAccount}
        onClick={jest.fn()}
        range="day"
      />,
    );
    expect(container.querySelector("#account-star-button")).not.toBeInTheDocument();
  });
});
