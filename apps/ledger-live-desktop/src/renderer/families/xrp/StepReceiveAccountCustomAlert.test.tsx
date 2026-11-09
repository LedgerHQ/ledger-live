import React from "react";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { fireEvent, render, screen } from "tests/testSetup";
import type { StepProps } from "~/renderer/modals/Receive/Body";
import StepReceiveAccountCustomAlert from "./StepReceiveAccountCustomAlert";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
} from "./__mocks__/account.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: jest.fn(),
}));
const mockGetXrpEnabledTokenStandards = jest.mocked(getXrpEnabledTokenStandards);

const mockDispatch = jest.fn();
jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => mockDispatch,
}));

const mainAccount = XRP_ACCOUNT;
const removedTokenAccount = XRP_REMOVED_TOKEN_ACCOUNT;
const token = removedTokenAccount.token;
const heldTokenAccount = XRP_IOU_TOKEN_ACCOUNT;

function renderAlert(account: Account | TokenAccount, parentAccount?: Account) {
  const closeModal = jest.fn();
  const props = { account, parentAccount, closeModal } as unknown as StepProps & {
    account: Account | TokenAccount;
  };
  const view = render(<StepReceiveAccountCustomAlert {...props} />);

  return { ...view, closeModal };
}

describe("xrp StepReceiveAccountCustomAlert", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetXrpEnabledTokenStandards.mockReturnValue(["iou"]);
  });

  it("asks to add a token before receiving one on the XRP account", () => {
    const { closeModal } = renderAlert(mainAccount);

    expect(screen.getByText(/add it to your account first/)).toBeVisible();
    fireEvent.click(screen.getByText("Add token"));

    expect(closeModal).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { name: "MODAL_XRP_ADD_TOKEN", data: { account: mainAccount } },
      }),
    );
  });

  it("asks to add a removed token again, preselected", () => {
    renderAlert(removedTokenAccount, mainAccount);

    expect(screen.getByText(/no longer holds RLUSD/)).toBeVisible();
    fireEvent.click(screen.getByText("Add token"));

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { name: "MODAL_XRP_ADD_TOKEN", data: { account: mainAccount, token } },
      }),
    );
  });

  it("shows nothing for a held token", () => {
    const { container } = renderAlert(heldTokenAccount, mainAccount);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing when no token standard is enabled", () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue([]);

    const { container } = renderAlert(mainAccount);

    expect(container).toBeEmptyDOMElement();
  });
});
