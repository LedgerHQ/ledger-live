/**
 * @jest-environment jsdom
 */
import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import type { Account } from "@ledgerhq/types-live";
import React from "react";
import { render, screen } from "tests/testSetup";
import Body from "../Body";

jest.mock("@ledgerhq/ledger-wallet-framework/sanction/index", () => ({
  isAddressSanctioned: jest.fn(),
}));

const mockedIsAddressSanctioned = jest.mocked(isAddressSanctioned);

const SANCTIONED_ETHEREUM = "0x7F367cC41522cE07553e823bf3be79A889DEbe1B";

const createSanctionedEthereumAccount = (): Account => {
  const base = genAccount("receive-sanctioned-test");
  return {
    ...base,
    id: "mock-sanctioned-account",
    name: "Sanctioned ETH",
    freshAddress: SANCTIONED_ETHEREUM,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    currency: getCryptoCurrencyById("ethereum"),
  };
};

describe("Receive flow on sanctioned account", () => {
  beforeEach(() => {
    mockedIsAddressSanctioned.mockResolvedValue(true);
  });

  it("shows the sanctioned error banner with the flagged address", async () => {
    const account = createSanctionedEthereumAccount();

    render(
      <Body
        stepId="account"
        onChangeStepId={jest.fn()}
        onChangeAddressVerified={jest.fn()}
        isAddressVerified={null}
        verifyAddressError={null}
        params={{ account }}
      />,
      { initialState: { accounts: [account] } },
    );

    expect(await screen.findByText("Keeping you safe")).toBeVisible();
    expect(
      screen.getByText(/This transaction involves a sanctioned wallet address/i),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(SANCTIONED_ETHEREUM))).toBeInTheDocument();
  });

  it("disables the Continue button when the account is sanctioned", async () => {
    const account = createSanctionedEthereumAccount();

    render(
      <Body
        stepId="account"
        onChangeStepId={jest.fn()}
        onChangeAddressVerified={jest.fn()}
        isAddressVerified={null}
        verifyAddressError={null}
        params={{ account }}
      />,
      { initialState: { accounts: [account] } },
    );

    await screen.findByText("Keeping you safe");
    expect(screen.getByTestId("modal-continue-button")).toBeDisabled();
  });

  it("does not render the sanctioned banner for a clean account", async () => {
    mockedIsAddressSanctioned.mockResolvedValue(false);
    const account = createSanctionedEthereumAccount();

    render(
      <Body
        stepId="account"
        onChangeStepId={jest.fn()}
        onChangeAddressVerified={jest.fn()}
        isAddressVerified={null}
        verifyAddressError={null}
        params={{ account }}
      />,
      { initialState: { accounts: [account] } },
    );

    expect(screen.queryByText("Keeping you safe")).not.toBeInTheDocument();
  });
});
