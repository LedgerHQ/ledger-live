import React from "react";
import BigNumber from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { getParentAccount } from "@ledgerhq/live-common/account/helpers";
import { render, screen } from "tests/testSetup";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
} from "./__mocks__/account.mock";
import { xrpIouToken } from "./__mocks__/currency.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/account/helpers", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/helpers"),
  getParentAccount: jest.fn(),
}));
jest.mock("~/renderer/hooks/useAccountUnit");

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

  it("shows the trust limit of a held IOU", () => {
    renderFooter(iouAccount);

    expect(screen.getByText("1,000 RLUSD")).toBeVisible();
  });

  it("shows whether rippling is on", () => {
    const { rerender } = renderFooter(iouAccount);

    expect(screen.getByText("Off")).toBeVisible();

    rerender(<AccountBalanceSummaryFooter account={ripplingIouAccount} />);

    expect(screen.getByText("On")).toBeVisible();
  });

  it("shows nothing for an MPT, which has no settings", () => {
    renderFooter(mptAccount);

    expect(screen.queryByText("Trust limit")).toBeNull();
  });

  it("shows nothing when no token standard is enabled", () => {
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue([]);

    renderFooter(iouAccount);

    expect(screen.queryByText("Trust limit")).toBeNull();
  });
});
