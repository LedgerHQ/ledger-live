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

  it.each<CryptoIconSize>([16, 20, 24, 32, 40, 48, 56])(
    "should render CryptoIcon with shape='square' for size %s",
    size => {
      mockedCryptoIcon.mockClear();

      render(<SquaredCryptoIcon {...defaultProps} size={size} />);

      expect(mockedCryptoIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          size,
          shape: "square",
          ledgerId: "ethereum",
          ticker: "ETH",
        }),
        undefined,
      );
    },
  );

  it("should use 48 as default size with square shape", () => {
    render(<SquaredCryptoIcon {...defaultProps} />);

    expect(mockedCryptoIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        size: 48,
        shape: "square",
      }),
      undefined,
    );
  });

  it("should forward additional props to CryptoIcon", () => {
    render(<SquaredCryptoIcon {...defaultProps} size={32} network="polygon" />);

    expect(mockedCryptoIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        ledgerId: "ethereum",
        ticker: "ETH",
        size: 32,
        network: "polygon",
        shape: "square",
      }),
      undefined,
    );
  });
});
