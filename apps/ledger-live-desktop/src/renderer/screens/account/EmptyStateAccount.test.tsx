import React from "react";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { render, screen } from "tests/testSetup";
import { importLLDCoinFamily } from "~/renderer/families";
import { XRP_ACCOUNT, makeXrpTokenAccount } from "~/renderer/families/xrp/__mocks__/account.mock";
import EmptyStateAccount from "./EmptyStateAccount";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: () => ["iou", "mpt"],
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog");

const renderEmptyTokenPage = (token: XrpTokenAccount) =>
  render(<EmptyStateAccount account={token} parentAccount={XRP_ACCOUNT} />);

beforeAll(async () => {
  await importLLDCoinFamily("xrp");
});

beforeEach(() => {
  jest.mocked(useRampCatalog).mockReturnValue({
    isCurrencyAvailable: () => false,
  } as unknown as ReturnType<typeof useRampCatalog>);
});

describe("EmptyStateAccount", () => {
  it("hides Receive on a frozen XRP token", async () => {
    renderEmptyTokenPage(makeXrpTokenAccount({ isLocked: true }));

    expect(await screen.findByText("No crypto assets yet?")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Receive" })).not.toBeInTheDocument();
  });

  it("shows Receive on an unfrozen XRP token", async () => {
    renderEmptyTokenPage(makeXrpTokenAccount());

    expect(await screen.findByRole("button", { name: "Receive" })).toBeVisible();
  });
});
