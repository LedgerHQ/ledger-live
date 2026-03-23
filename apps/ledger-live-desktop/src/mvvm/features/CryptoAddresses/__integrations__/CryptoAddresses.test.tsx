import React from "react";
import { render, screen } from "tests/testSetup";
import CryptoAddresses from "../index";
import useCryptoViewModel from "../hooks/useCryptoViewModel";
import type { CryptoViewModel } from "../types";

jest.mock("../hooks/useCryptoViewModel");
const mockedUseCryptoViewModel = jest.mocked(useCryptoViewModel);

const defaultViewModel: CryptoViewModel = {
  searchValue: "",
  setSearchValue: jest.fn(),
  onAddAddressClick: jest.fn(),
  onAccountClick: jest.fn(),
  rows: [],
  lookupParentAccount: jest.fn(),
};

describe("CryptoAddresses (Crypto page)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCryptoViewModel.mockReturnValue(defaultViewModel);
  });

  it("should render the Crypto page with header and content", () => {
    render(<CryptoAddresses />);

    expect(screen.getByText("Crypto accounts")).toBeVisible();
    expect(screen.getByTestId("crypto-page-content")).toBeVisible();
  });
});
