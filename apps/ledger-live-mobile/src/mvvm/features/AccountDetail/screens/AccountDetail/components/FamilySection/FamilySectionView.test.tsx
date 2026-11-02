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
jest.mock("~/generated/AccountHeader", () => ({ solana: mockBlock("header") }));
jest.mock("~/generated/AccountBalanceHeader", () => ({ solana: mockBlock("balance-header") }));
jest.mock("~/generated/AccountSubHeader", () => ({ solana: mockBlock("sub-header") }));
jest.mock("~/generated/PendingTransferProposals", () => ({
  solana: mockBlock("pending-transfer-proposals"),
}));
jest.mock("~/generated/AccountBodyHeader", () => ({
  solana: mockBlock("body-header"),
  cosmos: mockBlock("cosmos-body-header"),
}));
jest.mock("~/generated/AccountDetailDelegations", () => ({
  solana: mockBlock("detail-delegations"),
}));
jest.mock("~/generated/AccountBalanceSummaryFooter", () => ({
  solana: mockBlock("balance-summary-footer"),
  cosmos: mockBlock("cosmos-balance-summary-footer"),
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
});
