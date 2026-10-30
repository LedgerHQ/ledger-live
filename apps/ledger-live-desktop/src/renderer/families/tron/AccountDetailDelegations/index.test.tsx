import React from "react";
import { render, screen } from "tests/testSetup";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import AccountDetailDelegations from ".";
import { useTronDelegationsViewModel } from "./useTronDelegationsViewModel";

jest.mock("./useTronDelegationsViewModel");
jest.mock("@features/flow-account-detail-delegations", () => ({
  AccountDelegations: ({ testID }: { testID: string }) => <div data-testid={testID} />,
}));

const mockViewModel = jest.mocked(useTronDelegationsViewModel);
const tronAccount = { type: "Account", tronResources: {} } as unknown as TronAccount;

describe("Tron AccountDetailDelegations", () => {
  beforeEach(() => {
    mockViewModel.mockReturnValue({ testID: "tron-votes" } as ReturnType<
      typeof useTronDelegationsViewModel
    >);
  });

  it("renders the shared delegations of a Tron account", () => {
    render(<AccountDetailDelegations account={tronAccount} />);

    expect(screen.getByTestId("tron-votes")).toBeInTheDocument();
  });

  it("renders nothing while the account has no Tron resources yet", () => {
    const account = { type: "Account" } as unknown as TronAccount;

    const { container } = render(<AccountDetailDelegations account={account} />);

    expect(container).toBeEmptyDOMElement();
    expect(mockViewModel).not.toHaveBeenCalled();
  });

  it("renders nothing for a token account", () => {
    const account = { type: "TokenAccount" } as TokenAccount;

    const { container } = render(<AccountDetailDelegations account={account} />);

    expect(container).toBeEmptyDOMElement();
  });
});
