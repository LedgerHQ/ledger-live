import React from "react";
import { render, screen } from "@testing-library/react";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ChainIntegratorNotice } from "./ChainIntegratorNotice.web";

const resources = {
  en: { app: { chainIntegrators: { integratedBy: "Integrated by {{team}}." } } },
};

function renderNotice(currencyId: string) {
  return render(
    <I18nTestProvider resources={resources} defaultNS="app">
      <ChainIntegratorNotice currency={CRYPTO_CURRENCIES_REGISTRY[currencyId]} />
    </I18nTestProvider>,
  );
}

describe("ChainIntegratorNotice (Web)", () => {
  it("renders the integrator of a third-party chain", () => {
    renderNotice("solana");

    expect(screen.getByTestId("chain-integrator-notice")).toBeVisible();
    expect(screen.getByText("Integrated by Solana Labs.")).toBeVisible();
  });

  it("renders nothing for a chain integrated by Ledger", () => {
    renderNotice("ethereum");

    expect(screen.queryByTestId("chain-integrator-notice")).toBeNull();
  });
});
