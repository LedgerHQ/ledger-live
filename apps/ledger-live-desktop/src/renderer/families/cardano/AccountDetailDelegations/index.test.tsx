import React from "react";
import { render, screen } from "tests/testSetup";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import AccountDetailDelegations from ".";
import { useCardanoDelegationsViewModel } from "./useCardanoDelegationsViewModel";

jest.mock("./useCardanoDelegationsViewModel");
jest.mock("@features/flow-account-detail-delegations", () => ({
  AccountDelegations: ({ testID }: { testID: string }) => <div data-testid={testID} />,
}));

const mockViewModel = jest.mocked(useCardanoDelegationsViewModel);
const mainAccount = { type: "Account", cardanoResources: {} } as CardanoAccount;
const tokenAccount = { type: "TokenAccount" } as TokenAccount;

describe("Cardano AccountDetailDelegations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockViewModel.mockReturnValue({ testID: "cardano-delegations" } as ReturnType<
      typeof useCardanoDelegationsViewModel
    >);
  });

  it("renders the shared delegations of a main account", () => {
    render(<AccountDetailDelegations account={mainAccount} />);

    expect(screen.getByTestId("cardano-delegations")).toBeInTheDocument();
  });

  it("renders nothing for a token account", () => {
    const { container } = render(<AccountDetailDelegations account={tokenAccount} />);

    expect(container).toBeEmptyDOMElement();
    expect(mockViewModel).not.toHaveBeenCalled();
  });
});
