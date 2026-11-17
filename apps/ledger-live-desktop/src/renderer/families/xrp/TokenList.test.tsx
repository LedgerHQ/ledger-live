import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import tokenList from "./TokenList";
import addAssetAction from "./addAssetAction";
import { XRP_ACCOUNT } from "./__mocks__/account.mock";

const mockDispatch = jest.fn();
jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => mockDispatch,
}));

const openAddToken = expect.objectContaining({
  payload: { name: "MODAL_XRP_ADD_TOKEN", data: { account: XRP_ACCOUNT } },
});

describe("xrp add token entry points", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the add token flow from the token list", () => {
    render(<tokenList.ReceiveButton account={XRP_ACCOUNT} />);

    fireEvent.click(screen.getByText("Add token"));

    expect(mockDispatch).toHaveBeenCalledWith(openAddToken);
  });

  it("opens the add token flow from the Add asset action", () => {
    addAssetAction({ account: XRP_ACCOUNT, dispatch: mockDispatch });

    expect(mockDispatch).toHaveBeenCalledWith(openAddToken);
  });
});
