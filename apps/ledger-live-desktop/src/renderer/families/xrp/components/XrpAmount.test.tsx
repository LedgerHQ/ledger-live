import React from "react";
import BigNumber from "bignumber.js";
import { render } from "tests/testSetup";
import { xrpTestnetCurrency } from "../__mocks__/currency.mock";
import { XrpAmount } from "./XrpAmount";

const mockCountervalue = jest.fn();

jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useCalculateCountervalueCallback: () => mockCountervalue,
}));

const ONE_XRP_DROPS = new BigNumber(1_000_000);

describe("xrp XrpAmount", () => {
  beforeEach(() => {
    mockCountervalue.mockReset();
  });

  it("shows the XRP amount, then its countervalue", () => {
    mockCountervalue.mockReturnValue(new BigNumber(52));

    const { container } = render(
      <XrpAmount currency={xrpTestnetCurrency} value={ONE_XRP_DROPS} size="md" />,
    );

    expect(container).toHaveTextContent(/^1 XRP ·\s?\$0\.52$/);
  });

  it("shows the XRP amount alone without a rate", () => {
    mockCountervalue.mockReturnValue(null);

    const { container } = render(
      <XrpAmount currency={xrpTestnetCurrency} value={ONE_XRP_DROPS} size="sm" />,
    );

    expect(container).toHaveTextContent(/^1 XRP$/);
  });
});
