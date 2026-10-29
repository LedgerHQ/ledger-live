import React from "react";
import { render, screen } from "tests/testSetup";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import AccountDetailDelegations from ".";
import { useSolanaDelegationsViewModel } from "./useSolanaDelegationsViewModel";

jest.mock("./useSolanaDelegationsViewModel");
jest.mock("@features/flow-account-detail-delegations", () => ({
  AccountDelegations: ({ testID }: { testID: string }) => <div data-testid={testID} />,
}));

const mockViewModel = jest.mocked(useSolanaDelegationsViewModel);
const mainAccount = { type: "Account" } as SolanaAccount;
const tokenAccount = { type: "TokenAccount" } as TokenAccount;

describe("Solana AccountDetailDelegations", () => {
  it("renders the shared delegations of a main account", () => {
    mockViewModel.mockReturnValue({ testID: "solana-delegations" } as ReturnType<
      typeof useSolanaDelegationsViewModel
    >);

    render(<AccountDetailDelegations account={mainAccount} />);

    expect(screen.getByTestId("solana-delegations")).toBeInTheDocument();
  });

  it("renders nothing when the account has nothing to delegate", () => {
    mockViewModel.mockReturnValue(undefined);

    const { container } = render(<AccountDetailDelegations account={mainAccount} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a token account", () => {
    const { container } = render(<AccountDetailDelegations account={tokenAccount} />);

    expect(container).toBeEmptyDOMElement();
    expect(mockViewModel).not.toHaveBeenCalledWith(tokenAccount);
  });
});
