import React, { type ReactNode } from "react";
import { mockFiatCurrency } from "@domain/entity-currency-fiat/schema.mock";
import { AssetsTablePortsProvider } from "../assetsTablePorts";
import type { AssetsTablePorts } from "../ports";

export function mockAssetsTablePorts(overrides?: Partial<AssetsTablePorts>): AssetsTablePorts {
  const counterValueCurrency = overrides?.counterValueCurrency ?? mockFiatCurrency();
  return {
    counterValueCurrency,
    discreet: false,
    formatCounterValue: () => "$0.00",
    formatPrice: () => "$0.00",
    getCurrencyPortfolio: () => ({
      history: [],
      countervalueChange: { percentage: null, value: 0 },
    }),
    getCurrentBalanceCountervalueChange: () => ({ percentage: null }),
    BalanceCell: () => null,
    CounterValueCell: () => null,
    TruncatedText: () => null,
    ...overrides,
  };
}

export function PortsWrapper({
  ports,
  children,
}: {
  readonly ports: AssetsTablePorts;
  readonly children: ReactNode;
}) {
  return <AssetsTablePortsProvider value={ports}>{children}</AssetsTablePortsProvider>;
}
