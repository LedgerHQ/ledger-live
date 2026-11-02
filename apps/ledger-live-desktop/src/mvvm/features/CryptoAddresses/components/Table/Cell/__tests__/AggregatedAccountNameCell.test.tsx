import React from "react";
import { render, screen } from "tests/testSetup";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { AggregatedAccountNameCell } from "../AggregatedAccountNameCell";

const account = { type: "Account", currency: getCryptoCurrencyById("bitcoin") } as Account;

const renderCell = (tag?: string) =>
  render(
    <table>
      <tbody>
        <tr>
          <AggregatedAccountNameCell account={account} displayName="BTC Gold" tag={tag} />
        </tr>
      </tbody>
    </table>,
  );

describe("AggregatedAccountNameCell", () => {
  it("shows the address type next to the name of the account", () => {
    renderCell("Native segwit");

    expect(screen.getByText("BTC Gold")).toBeInTheDocument();
    expect(screen.getByText("Native segwit")).toBeInTheDocument();
  });

  it("shows only the name when the account has no address type", () => {
    renderCell();

    expect(screen.getByText("BTC Gold")).toBeInTheDocument();
    expect(screen.queryByText("Native segwit")).toBeNull();
  });
});
