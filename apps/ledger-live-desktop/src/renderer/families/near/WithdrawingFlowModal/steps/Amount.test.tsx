import React from "react";
import { BigNumber } from "bignumber.js";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { render, screen } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import StepAmount from "./Amount";
import type { StepProps } from "../types";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
}));

jest.mock("../fields", () => ({
  ValidatorField: () => null,
  AmountField: () => null,
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  }),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ isCurrencyAvailable: () => false }),
}));

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/exchange/swap/hooks/index"),
  useFetchCurrencyAll: () => ({ data: [] }),
}));

jest.mock("~/renderer/screens/exchange/Swap2/utils", () => ({
  ...jest.requireActual("~/renderer/screens/exchange/Swap2/utils"),
  useGetSwapTrackingProperties: () => ({}),
}));

const account = genAccount("near-withdraw-step", { currency: getCryptoCurrencyById("near") });

const props = (errors: Record<string, Error>): StepProps =>
  ({
    account,
    transaction: { family: "near", mode: "withdraw", recipient: "", amount: new BigNumber(0) },
    onUpdateTransaction: jest.fn(),
    status: {
      errors,
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(0),
      totalSpent: new BigNumber(0),
    },
    onClose: jest.fn(),
  }) as unknown as StepProps;

describe("Withdraw StepAmount", () => {
  it("explains a fee shortfall with the funding banner", () => {
    render(<StepAmount {...props({ amount: new NotEnoughBalance() })} />);

    expect(screen.getByText(/insufficient to pay for the network fees/)).toBeVisible();
  });

  it("shows no funding banner when the amount is valid", () => {
    render(<StepAmount {...props({})} />);

    expect(screen.queryByText(/insufficient to pay for the network fees/)).toBeNull();
  });
});
