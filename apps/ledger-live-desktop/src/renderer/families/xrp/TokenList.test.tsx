import React from "react";
import { AccountIdSchema } from "@domain/entity-account";
import { fireEvent, render, screen } from "tests/testSetup";
import tokenList from "./TokenList";
import addAssetAction from "./addAssetAction";
import { openXrpDialog } from "./xrpDialog";
import { XRP_ACCOUNT } from "./__mocks__/account.mock";

const mockDispatch = jest.fn();
jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => mockDispatch,
}));

const openAddToken = openXrpDialog(AccountIdSchema.parse(XRP_ACCOUNT.id), { screen: "addAsset" });

describe("xrp add token entry points", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the add token flow from the token list", () => {
    render(<tokenList.ReceiveButton account={XRP_ACCOUNT} />);

    fireEvent.click(screen.getByText("Add"));

    expect(mockDispatch).toHaveBeenCalledWith(openAddToken);
  });

  it("opens the add token flow from the Add asset action", () => {
    addAssetAction({ account: XRP_ACCOUNT, dispatch: mockDispatch });

    expect(mockDispatch).toHaveBeenCalledWith(openAddToken);
  });
});
