import React from "react";
import { View } from "react-native";
import { render, screen } from "@tests/test-renderer";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type { AccountLike } from "@ledgerhq/types-live";
import AccountDetailDelegations from "./AccountDetailDelegations";
import { useSolanaDelegationsViewModel } from "./useSolanaDelegationsViewModel";

jest.mock("./useSolanaDelegationsViewModel");
jest.mock("@features/flow-account-detail-delegations", () => ({
  AccountDelegations: ({ testID }: { testID: string }) => <View testID={testID} />,
}));

const mockViewModel = jest.mocked(useSolanaDelegationsViewModel);

describe("Solana AccountDetailDelegations", () => {
  beforeEach(() => {
    mockViewModel.mockReturnValue({ testID: "solana-delegations" } as ReturnType<
      typeof useSolanaDelegationsViewModel
    >);
  });

  it("renders the shared delegations of an account with staking resources", () => {
    const account = { stakingResources: {} } as unknown as SolanaAccount;

    render(<AccountDetailDelegations account={account} />);

    expect(screen.getByTestId("solana-delegations")).toBeVisible();
  });

  it("renders nothing for an account without staking resources", () => {
    render(<AccountDetailDelegations account={{ type: "Account" } as AccountLike} />);

    expect(screen.queryByTestId("solana-delegations")).toBeNull();
  });
});
