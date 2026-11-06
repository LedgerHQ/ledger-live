import React from "react";
import BigNumber from "bignumber.js";
import i18next from "i18next";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { render, screen } from "@tests/test-renderer";
import { getDrawerInfo } from "../drawerInfo";

const currency = getCryptoCurrencyById("polkadot");
const account = genAccount("polkadot-drawer-info", { currency });
const ADDRESS = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";

describe("getDrawerInfo", () => {
  it("opens the explorer on the validator address", async () => {
    const onOpenExplorer = jest.fn();
    const rows = getDrawerInfo({
      t: i18next.t,
      account,
      nomination: { address: ADDRESS, value: new BigNumber(1), status: "active" },
      onOpenExplorer,
      unit: currency.units[0],
    });
    const addressRow = rows.find(row => row.label === i18next.t("delegation.validatorAddress"));

    const { user } = render(<>{addressRow?.Component}</>);
    await user.press(screen.getByText(ADDRESS));

    expect(onOpenExplorer).toHaveBeenCalledWith(ADDRESS);
  });
});
