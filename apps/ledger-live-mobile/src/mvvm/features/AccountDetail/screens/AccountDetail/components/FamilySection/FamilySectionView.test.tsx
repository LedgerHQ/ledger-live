import React from "react";
import { View } from "react-native";
import { render, screen } from "@testing-library/react-native";
import type { Account } from "@ledgerhq/types-live";
import { FamilySectionView } from "./FamilySectionView";
import type { FamilySectionViewModel } from "./useFamilySectionViewModel";

function mockBlock(testID: string) {
  return () => <View testID={testID} />;
}

jest.mock("@features/flow-account-detail-notices", () => ({
  AccountNotices: () => null,
}));
jest.mock("~/generated/AccountHeader", () => ({
  solana: mockBlock("header"),
  near: mockBlock("near-header"),
}));
jest.mock("~/generated/AccountBalanceHeader", () => ({
  solana: mockBlock("balance-header"),
  near: mockBlock("near-balance-header"),
}));
jest.mock("~/generated/AccountSubHeader", () => ({
  solana: mockBlock("sub-header"),
  near: mockBlock("near-sub-header"),
}));
jest.mock("~/generated/PendingTransferProposals", () => ({
  solana: mockBlock("pending-transfer-proposals"),
  near: mockBlock("near-pending-transfer-proposals"),
}));
jest.mock("~/generated/AccountBodyHeader", () => ({
  solana: mockBlock("body-header"),
  cosmos: mockBlock("cosmos-body-header"),
  near: mockBlock("near-body-header"),
}));
jest.mock("~/generated/AccountDetailDelegations", () => ({
  solana: mockBlock("detail-delegations"),
}));
jest.mock("~/generated/AccountDetailBalanceSummary", () => ({
  tron: mockBlock("detail-balances"),
}));
jest.mock("~/generated/AccountBalanceSummaryFooter", () => ({
  solana: mockBlock("balance-summary-footer"),
  cosmos: mockBlock("cosmos-balance-summary-footer"),
  tron: mockBlock("tron-balance-summary-footer"),
  near: mockBlock("near-balance-summary-footer"),
}));
jest.mock("~/generated/AccountDetailSection", () => ({
  near: mockBlock("detail-section"),
}));

const viewModel = (family: string): FamilySectionViewModel => ({
  account: { currency: { family } } as Account,
  notices: [],
  showEarnBlocks: true,
  showBodyBlocks: true,
  onOpenLink: jest.fn(),
  onOpenPerps: jest.fn(),
});

const renderedBlocks = (ids: readonly string[]) =>
  ids.filter(id => screen.queryByTestId(id) !== null);

describe("FamilySectionView", () => {
  it("renders the account detail section instead of the legacy blocks", () => {
    render(<FamilySectionView {...viewModel("near")} />);

    expect(screen.getAllByTestId(/.+/).map(node => node.props.testID)).toEqual(["detail-section"]);
  });

  it("renders the Account Detail delegations last, instead of the legacy body header", () => {
    render(<FamilySectionView {...viewModel("solana")} />);

    expect(renderedBlocks(["detail-delegations", "body-header"])).toEqual(["detail-delegations"]);
    expect(screen.getAllByTestId(/.+/).map(node => node.props.testID)).toEqual([
      "header",
      "balance-header",
      "sub-header",
      "pending-transfer-proposals",
      "balance-summary-footer",
      "detail-delegations",
    ]);
  });

  it("keeps the legacy body header last for a family without Account Detail delegations", () => {
    render(<FamilySectionView {...viewModel("cosmos")} />);

    expect(screen.getAllByTestId(/.+/).map(node => node.props.testID)).toEqual([
      "cosmos-balance-summary-footer",
      "cosmos-body-header",
    ]);
  });

  it("renders the Account Detail balances in place of the legacy balance summary footer", () => {
    render(<FamilySectionView {...viewModel("tron")} />);

    expect(screen.getAllByTestId(/.+/).map(node => node.props.testID)).toEqual(["detail-balances"]);
  });

  it("keeps the legacy balance summary footer for a family without Account Detail balances", () => {
    render(<FamilySectionView {...viewModel("cosmos")} />);

    expect(screen.queryByTestId("detail-balances")).toBeNull();
    expect(screen.getByTestId("cosmos-balance-summary-footer")).toBeVisible();
  });
});
