import React from "react";
import { render, screen } from "tests/testSetup";
import Cryptos from "../index";
import useCryptosViewModel from "../hooks/useCryptosViewModel";
import type { CryptosViewModel } from "../types";

jest.mock("../hooks/useCryptosViewModel");
const mockedUseCryptosViewModel = jest.mocked(useCryptosViewModel);

const defaultViewModel: CryptosViewModel = {
  searchValue: "",
  setSearchValue: jest.fn(),
  onAddAddressClick: jest.fn(),
  onAccountClick: jest.fn(),
  rows: [],
  lookupParentAccount: jest.fn(),
};

describe("Cryptos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCryptosViewModel.mockReturnValue(defaultViewModel);
  });

  it("should render the Cryptos page with header and content", () => {
    render(<Cryptos />);

    expect(screen.getByText("Crypto accounts")).toBeVisible();
    expect(screen.getByTestId("cryptos-page-content")).toBeVisible();
  });
});
