import React from "react";
import BigNumber from "bignumber.js";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import type { OperationDetailsParamList } from "../../types";
import { OperationDetails } from "../OperationDetails";

const filecoinAccount = genAccount("filecoin-1", { currency: getCryptoCurrencyById("filecoin") });
const bitcoinAccount = genAccount("bitcoin-1", { currency: getCryptoCurrencyById("bitcoin") });

// The screen only reads `route.params`, so navigation is here to satisfy the type.
const navigation = {} as unknown as OperationDetailsParamList["navigation"];

function renderOperationDetails(fromAccount: Account, hash: string, accounts: Account[]) {
  const operation = {
    id: `${fromAccount.id}-op`,
    hash,
    type: "OUT",
    value: new BigNumber(1),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: 1,
    blockHash: null,
    accountId: fromAccount.id,
    date: new Date("2026-10-01T00:00:00Z"),
    extra: {},
  } as Operation;

  const route: OperationDetailsParamList["route"] = {
    key: "SwapOperationDetails",
    name: ScreenName.SwapOperationDetails,
    params: {
      swapOperation: {
        swapId: "swap-1",
        provider: "changelly",
        status: "finished",
        fromAccountId: fromAccount.id,
        toAccountId: bitcoinAccount.id,
        toExists: true,
        operation,
        fromAmount: new BigNumber(1),
        toAmount: new BigNumber(1),
      },
    },
  };

  return render(<OperationDetails route={route} navigation={navigation} />, {
    overrideInitialState: state => ({
      ...state,
      accounts: { ...state.accounts, active: accounts },
    }),
  });
}

describe("Swap OperationDetails explorer link", () => {
  const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

  beforeEach(() => openURL.mockClear());

  it("resolves the link through the family hook when the family provides one", async () => {
    const { user } = renderOperationDetails(
      filecoinAccount,
      "bafy2bzacecsnwpizr2wvzm3jcgzfwyaprhdvvnsc33xdmx37gpm6zuaorkuce",
      [filecoinAccount, bitcoinAccount],
    );

    await user.press(screen.getByTestId("operation-detail-view-in-explorer-button"));

    expect(openURL).toHaveBeenCalledWith(
      "https://filecoin.blockscout.com/tx/0xa4db3d198ead5cb36911b25b600f89c75ab642deee365f7f33d9ecd00e8aa822",
    );
  });

  it("falls back to the generic explorer with the raw hash when the family has no hook", async () => {
    const hash = "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b";
    const { user } = renderOperationDetails(bitcoinAccount, hash, [bitcoinAccount]);

    await user.press(screen.getByTestId("operation-detail-view-in-explorer-button"));

    expect(openURL).toHaveBeenCalledWith(`https://blockstream.info/tx/${hash}`);
  });

  it("shows no explorer link when the source account is unknown", () => {
    renderOperationDetails(
      filecoinAccount,
      "bafy2bzacecsnwpizr2wvzm3jcgzfwyaprhdvvnsc33xdmx37gpm6zuaorkuce",
      [bitcoinAccount],
    );

    expect(screen.queryByTestId("operation-detail-view-in-explorer-button")).toBeNull();
  });
});
