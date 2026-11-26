import React from "react";
import { render, screen } from "tests/testSetup";
import AccountSubHeader from "./AccountSubHeader";
import { XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT, makeXrpTokenAccount } from "./__mocks__/account.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: () => ["iou", "mpt"],
}));

describe("xrp AccountSubHeader", () => {
  it("shows the frozen banner on a frozen token page", () => {
    render(
      <AccountSubHeader
        account={makeXrpTokenAccount({ isLocked: true })}
        parentAccount={XRP_ACCOUNT}
      />,
    );

    expect(screen.getByText("Your RLUSD has been frozen")).toBeVisible();
    expect(
      screen.getByText(
        "The issuer has frozen this asset. You can't use it until the freeze is lifted.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Learn more" })).toBeVisible();
  });

  it("shows nothing on an unfrozen token page", () => {
    render(<AccountSubHeader account={XRP_IOU_TOKEN_ACCOUNT} parentAccount={XRP_ACCOUNT} />);

    expect(screen.queryByTestId("xrp-frozen-tokens-banner")).not.toBeInTheDocument();
  });

  it("shows nothing on the XRP account page", () => {
    render(<AccountSubHeader account={XRP_ACCOUNT} parentAccount={null} />);

    expect(screen.queryByTestId("xrp-frozen-tokens-banner")).not.toBeInTheDocument();
  });
});
