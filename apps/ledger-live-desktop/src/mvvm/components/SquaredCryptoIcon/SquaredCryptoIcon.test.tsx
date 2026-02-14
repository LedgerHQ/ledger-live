import React from "react";
import { render } from "tests/testSetup";
import { CryptoIconSize, SquaredCryptoIcon } from "./index";
import { CryptoIcon } from "@ledgerhq/crypto-icons";

jest.mock("@ledgerhq/crypto-icons", () => ({
  CryptoIcon: jest.fn(props => (
    <div data-testid="crypto-icon" data-props={JSON.stringify(props)} />
  )),
}));

const mockedCryptoIcon = jest.mocked(CryptoIcon);

describe("SquaredCryptoIcon", () => {
  beforeEach(() => {
    mockedCryptoIcon.mockClear();
  });

  const defaultProps = {
    ledgerId: "ethereum",
    ticker: "ETH",
  };

  it("should render CryptoIcon with correct radius for each size", () => {
    const sizeToRadiusMap: Record<string, string> = {
      "16px": "4px",
      "20px": "5px",
      "24px": "6px",
      "32px": "8px",
      "40px": "10px",
      "48px": "12px",
      "56px": "14px",
    };

    Object.entries(sizeToRadiusMap).forEach(([size, expectedRadius]) => {
      mockedCryptoIcon.mockClear();

      render(<SquaredCryptoIcon {...defaultProps} size={size as CryptoIconSize} />);

      expect(mockedCryptoIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          size,
          overridesRadius: expectedRadius,
          ledgerId: "ethereum",
          ticker: "ETH",
        }),
        undefined,
      );
    });
  });

  it("should use 48px as default size with 12px radius", () => {
    render(<SquaredCryptoIcon {...defaultProps} />);

    expect(mockedCryptoIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        size: "48px",
        overridesRadius: "12px",
      }),
      undefined,
    );
  });

  it("should forward additional props to CryptoIcon", () => {
    render(<SquaredCryptoIcon {...defaultProps} size="32px" network="polygon" />);

    expect(mockedCryptoIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        ledgerId: "ethereum",
        ticker: "ETH",
        size: "32px",
        network: "polygon",
        overridesRadius: "8px",
      }),
      undefined,
    );
  });
});
