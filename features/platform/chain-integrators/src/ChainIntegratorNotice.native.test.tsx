import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ChainIntegratorNotice } from "./ChainIntegratorNotice.native";

const resources = {
  en: { common: { chainIntegrators: { integratedBy: "Integrated by {{team}}." } } },
};

function renderNotice(currencyId: string) {
  return render(
    <I18nTestProvider resources={resources} defaultNS="common">
      <ChainIntegratorNotice currency={CRYPTO_CURRENCIES_REGISTRY[currencyId]} />
    </I18nTestProvider>,
  );
}

describe("ChainIntegratorNotice (Native)", () => {
  it("renders the integrator of a third-party chain", () => {
    renderNotice("ton");

    expect(screen.getByTestId("chain-integrator-notice")).toBeTruthy();
    expect(screen.getByText("Integrated by Zondax.")).toBeTruthy();
  });

  it("renders nothing for a chain integrated by Ledger", () => {
    renderNotice("bitcoin");

    expect(screen.queryByTestId("chain-integrator-notice")).toBeNull();
  });
});
