import React from "react";
import { View } from "react-native";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import { render, screen } from "@tests/test-renderer";
import { AccountDetailSectionView } from "./AccountDetailSectionView";

jest.mock("./AccountDetailBalanceSummary", () => ({
  __esModule: true,
  default: () => <View testID="balance-summary" />,
}));
jest.mock("./AccountDetailDelegations", () => ({
  __esModule: true,
  default: () => <View testID="delegations" />,
}));

const account = { type: "Account" } as SolanaAccount;

describe("AccountDetailSectionView", () => {
  it("renders the balance summary and the delegations", () => {
    render(<AccountDetailSectionView account={account} showBalanceSummary showDelegations />);

    expect(screen.getAllByTestId(/.+/).map(node => node.props.testID)).toEqual([
      "balance-summary",
      "delegations",
    ]);
  });

  it("renders nothing when the staking blocks are hidden", () => {
    render(
      <AccountDetailSectionView
        account={account}
        showBalanceSummary={false}
        showDelegations={false}
      />,
    );

    expect(screen.queryByTestId("balance-summary")).toBeNull();
    expect(screen.queryByTestId("delegations")).toBeNull();
  });
});
