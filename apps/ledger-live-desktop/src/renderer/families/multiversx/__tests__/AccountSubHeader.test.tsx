import React from "react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { MultiversXAccount } from "@ledgerhq/live-common/families/multiversx/types";
import { render, screen } from "tests/testSetup";
import MultiversXAccountSubHeader from "../AccountSubHeader";

function multiversxAccount(isGuarded: boolean): MultiversXAccount {
  return {
    ...genAccount("multiversx-sub-header", { currency: getCryptoCurrencyById("elrond") }),
    multiversxResources: { nonce: 0, delegations: [], isGuarded },
  };
}

describe("MultiversXAccountSubHeader", () => {
  it("warns about a guarded account", () => {
    render(<MultiversXAccountSubHeader account={multiversxAccount(true)} />);

    expect(screen.getByText(/If you have a guardian set on your account/)).toBeVisible();
  });

  it("renders nothing for an account without a guardian", () => {
    const { container } = render(<MultiversXAccountSubHeader account={multiversxAccount(false)} />);

    expect(container).toBeEmptyDOMElement();
  });
});
