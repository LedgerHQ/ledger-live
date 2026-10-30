import React from "react";
import { renderHook } from "@testing-library/react";
import { mockCryptoCurrency } from "@domain/entity-currency-crypto/schema.mock";
import { mockFiatCurrency } from "@domain/entity-currency-fiat/schema.mock";
import { useCalculate } from "@features/platform-market-countervalues";
import { BigNumber } from "bignumber.js";
import { mockAssetsTablePorts, PortsWrapper } from "./testing/mockAssetsTablePorts";
import { usePriceCellViewModel } from "./usePriceCellViewModel";

jest.mock("@features/platform-market-countervalues", () => ({
  useCalculate: jest.fn(),
}));

const mockedUseCalculate = jest.mocked(useCalculate);
const usd = mockFiatCurrency();
const bitcoin = mockCryptoCurrency();
const usdUnit = usd.units[0];
const atoms = (fiat: number) => new BigNumber(fiat).times(10 ** usdUnit.magnitude);

function renderPrice(marketPrice: number | undefined, formatted = "$0.00") {
  const formatPrice = jest.fn().mockReturnValue(formatted);
  const ports = mockAssetsTablePorts({
    counterValueCurrency: usd,
    formatPrice,
  });
  const view = renderHook(() => usePriceCellViewModel(bitcoin, marketPrice), {
    wrapper: ({ children }) => <PortsWrapper ports={ports}>{children}</PortsWrapper>,
  });
  return { ...view, formatPrice };
}

describe("usePriceCellViewModel", () => {
  beforeEach(() => {
    mockedUseCalculate.mockReset();
    mockedUseCalculate.mockReturnValue(undefined);
  });

  it("prefers marketPrice over the countervalue when both are available", () => {
    mockedUseCalculate.mockReturnValue(atoms(50_000).toNumber());
    const { result, formatPrice } = renderPrice(43_000, "$43,000.00");

    expect(result.current.formattedPrice).toBe("$43,000.00");
    expect(formatPrice).toHaveBeenCalledWith(usdUnit, atoms(43_000), { showCode: true });
  });

  it("formats a sub-dollar marketPrice", () => {
    const { result, formatPrice } = renderPrice(0.07, "$0.07");

    expect(result.current.formattedPrice).toBe("$0.07");
    expect(formatPrice).toHaveBeenCalledWith(usdUnit, atoms(0.07), { showCode: true });
  });

  it("falls back to the countervalue of one asset unit when marketPrice is undefined", () => {
    mockedUseCalculate.mockReturnValue(atoms(50_000).toNumber());
    const { result, formatPrice } = renderPrice(undefined, "$50,000.00");

    expect(mockedUseCalculate).toHaveBeenCalledWith({
      from: bitcoin,
      to: usd,
      value: 10 ** bitcoin.units[0].magnitude,
      disableRounding: true,
    });
    expect(result.current.formattedPrice).toBe("$50,000.00");
    expect(formatPrice).toHaveBeenCalledWith(usdUnit, atoms(50_000), { showCode: true });
  });

  it("returns '-' when neither marketPrice nor the countervalue is available", () => {
    const { result, formatPrice } = renderPrice(undefined);

    expect(result.current.formattedPrice).toBe("-");
    expect(formatPrice).not.toHaveBeenCalled();
  });
});
