import React from "react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { render, screen } from "tests/testSetup";
import type { StepProps } from "../types";
import { StepTokenFooter } from "./StepToken";

const USD_CODE = "5553440000000000000000000000000000000000";
const usdFromIssuerA = {
  tokenType: "iou",
  tokenIdentifier: USD_CODE,
  contractAddress: "rIssuerA",
} as TokenCurrency;
const usdFromIssuerB = { ...usdFromIssuerA, contractAddress: "rIssuerB" } as TokenCurrency;

function renderFooter(token: TokenCurrency, transactionToken: TokenCurrency) {
  const transaction = {
    assetReference: transactionToken.tokenIdentifier,
    assetOwner: transactionToken.contractAddress,
  } as Transaction;

  const props = {
    token,
    transaction,
    bridgePending: false,
    transitionTo: jest.fn(),
  };

  render(<StepTokenFooter {...(props as unknown as StepProps)} />);
}

describe("StepTokenFooter", () => {
  it("waits while the transaction holds the same code from another issuer", () => {
    renderFooter(usdFromIssuerB, usdFromIssuerA);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("continues once the transaction holds the picked token", () => {
    renderFooter(usdFromIssuerB, usdFromIssuerB);

    expect(screen.getByRole("button")).toBeEnabled();
  });
});
