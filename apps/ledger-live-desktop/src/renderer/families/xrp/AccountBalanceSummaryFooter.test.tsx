import React from "react";
import BigNumber from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { getParentAccount } from "@ledgerhq/live-common/account/helpers";
import { MAX_TRUST_LIMIT_VALUE } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { fireEvent, render, screen } from "tests/testSetup";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
  makeXrpTokenAccount,
} from "./__mocks__/account.mock";
import { XRP_TOKEN, xrpIouToken } from "./__mocks__/currency.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/account/helpers", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/helpers"),
  getParentAccount: jest.fn(),
}));
jest.mock("~/renderer/hooks/useAccountUnit");
const mockDispatch = jest.fn();
jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => mockDispatch,
}));

const parentAccount = XRP_ACCOUNT;
const iouAccount = XRP_IOU_TOKEN_ACCOUNT;
const ripplingIouAccount = {
  ...iouAccount,
  xrpResources: { isLocked: false, limit: new BigNumber(1000), isRippling: true },
};
const mptAccount = XRP_MPT_TOKEN_ACCOUNT;

const renderFooter = (account: TokenAccount) =>
  render(<AccountBalanceSummaryFooter account={account} />);

describe("xrp AccountBalanceSummaryFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou", "mpt"]);
    jest.mocked(getParentAccount).mockReturnValue(parentAccount);
    jest.mocked(useAccountUnit).mockReturnValue(xrpIouToken.units[0]);
  });

  it("opens the settings edit of a held IOU", () => {
    renderFooter(iouAccount);

    expect(screen.getByText("1,000 RLUSD")).toBeVisible();
    fireEvent.click(screen.getByTestId("xrp-edit-token-settings"));

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          name: "MODAL_XRP_ADD_TOKEN",
          data: { account: parentAccount, tokenAccount: iouAccount },
        },
      }),
    );
  });

  it("shows whether rippling is on", () => {
    const { rerender } = renderFooter(iouAccount);

    expect(screen.getByText("Off")).toBeVisible();

    rerender(<AccountBalanceSummaryFooter account={ripplingIouAccount} />);

    expect(screen.getByText("On")).toBeVisible();
  });

  it("offers no edit for an MPT, which has no settings", () => {
    renderFooter(mptAccount);

    expect(screen.queryByTestId("xrp-edit-token-settings")).toBeNull();
  });

  it("offers no edit when no token standard is enabled", () => {
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue([]);

    renderFooter(iouAccount);

    expect(screen.queryByTestId("xrp-edit-token-settings")).toBeNull();
  });

  it("shows Maximum for the protocol maximum", () => {
    jest.mocked(useAccountUnit).mockReturnValue(XRP_TOKEN.units[0]);

    renderFooter(makeXrpTokenAccount({ limit: MAX_TRUST_LIMIT_VALUE }));

    expect(screen.getByText("Maximum")).toBeVisible();
  });

  it("shows a limit above 16 integer digits in scientific notation", () => {
    jest.mocked(useAccountUnit).mockReturnValue(XRP_TOKEN.units[0]);

    renderFooter(makeXrpTokenAccount({ limit: MAX_TRUST_LIMIT_VALUE.shiftedBy(-1) }));

    expect(screen.getByText(/^9\.999999999999999e94 /)).toBeVisible();
  });
});
