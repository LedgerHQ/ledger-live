import React from "react";
import { render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { FamilyAppEffects } from "../index";

// The real family registry, with only the observer itself replaced.
jest.mock("~/renderer/families/bitcoin/zcashActivationTracking", () => ({
  ZcashFirstSyncTracking: () => <div data-testid="zcash-first-sync-tracking" />,
}));

const accountOf = (currencyId: string): Account => ({
  ...createFixtureAccount(),
  id: `js:2:${currencyId}:xpub:`,
  currency: getCryptoCurrencyById(currencyId),
});

describe("FamilyAppEffects in a wallet holding Zcash only", () => {
  it("mounts the Zcash first sync tracking", async () => {
    render(<FamilyAppEffects />, { initialState: { accounts: [accountOf("zcash")] } });

    expect(await screen.findByTestId("zcash-first-sync-tracking")).toBeInTheDocument();
  });

  it("does not mount it for a wallet holding bitcoin only", async () => {
    render(<FamilyAppEffects />, { initialState: { accounts: [accountOf("bitcoin")] } });

    // Let any lazy effect chunk resolve before asserting it never rendered.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(screen.queryByTestId("zcash-first-sync-tracking")).not.toBeInTheDocument();
  });
});
