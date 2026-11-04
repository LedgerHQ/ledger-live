import React from "react";
import { View } from "react-native";
import { render, screen } from "@tests/test-renderer";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import type { AccountLike } from "@ledgerhq/types-live";
import AccountDetailDelegations from "./AccountDetailDelegations";
import { useCardanoDelegationsViewModel } from "./useCardanoDelegationsViewModel";

jest.mock("./useCardanoDelegationsViewModel");
jest.mock("./Delegations/DRepDelegationSelfTransactionInfoDrawer", () => () => null);
jest.mock("@features/flow-account-detail-delegations", () => ({
  AccountDelegations: ({ testID }: { testID: string }) => <View testID={testID} />,
}));

const mockViewModel = jest.mocked(useCardanoDelegationsViewModel);
const cardanoAccount = { type: "Account", cardanoResources: {} } as unknown as CardanoAccount;

describe("Cardano AccountDetailDelegations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockViewModel.mockReturnValue({
      props: { testID: "cardano-delegations" },
      selfTxDrawer: { isOpen: false, onClose: jest.fn() },
    } as unknown as ReturnType<typeof useCardanoDelegationsViewModel>);
  });

  it("renders the shared delegations of a Cardano account", () => {
    render(<AccountDetailDelegations account={cardanoAccount} />);

    expect(screen.getByTestId("cardano-delegations")).toBeVisible();
  });

  it("renders nothing for a token account", () => {
    render(<AccountDetailDelegations account={{ type: "TokenAccount" } as AccountLike} />);

    expect(screen.queryByTestId("cardano-delegations")).toBeNull();
    expect(mockViewModel).not.toHaveBeenCalled();
  });
});
