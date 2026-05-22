/**
 * @jest-environment jsdom
 */
import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import type { Account } from "@ledgerhq/types-live";
import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
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
    freshAddress: SANCTIONED_ETHEREUM,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    currency: getCryptoCurrencyById("ethereum"),
  };
};

const renderBody = (account: Account) =>
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

describe("Receive flow on sanctioned account", () => {
  it("disables the Continue button and surfaces the sanctioned address when the account is flagged", async () => {
    mockedIsAddressSanctioned.mockResolvedValue(true);
    const account = createSanctionedEthereumAccount();

    renderBody(account);

    await waitFor(() => {
      expect(screen.getByTestId("modal-continue-button")).toBeDisabled();
    });
    expect(mockedIsAddressSanctioned).toHaveBeenCalledWith(account.currency, SANCTIONED_ETHEREUM);
    expect(screen.getByText(new RegExp(SANCTIONED_ETHEREUM))).toBeInTheDocument();
  });

  it("keeps the Continue button enabled for a clean account", async () => {
    mockedIsAddressSanctioned.mockResolvedValue(false);
    const account = createSanctionedEthereumAccount();

    renderBody(account);

    await waitFor(() => {
      expect(mockedIsAddressSanctioned).toHaveBeenCalled();
    });
    expect(screen.getByTestId("modal-continue-button")).not.toBeDisabled();
    expect(screen.queryByText(new RegExp(SANCTIONED_ETHEREUM))).not.toBeInTheDocument();
  });
});
