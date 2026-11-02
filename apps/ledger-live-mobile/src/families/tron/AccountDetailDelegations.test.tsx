import React from "react";
import { View } from "react-native";
import { render, screen } from "@tests/test-renderer";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import type { AccountLike } from "@ledgerhq/types-live";
import AccountDetailDelegations from "./AccountDetailDelegations";
import { useTronDelegationsViewModel } from "./useTronDelegationsViewModel";

jest.mock("./useTronDelegationsViewModel");
jest.mock("@features/flow-account-detail-delegations", () => ({
  AccountDelegations: ({ testID }: { testID: string }) => <View testID={testID} />,
}));

const mockViewModel = jest.mocked(useTronDelegationsViewModel);
const tronAccount = { type: "Account", tronResources: {} } as unknown as TronAccount;

describe("Tron AccountDetailDelegations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockViewModel.mockReturnValue({ testID: "tron-votes" } as ReturnType<
      typeof useTronDelegationsViewModel
    >);
  });

  it("renders the shared delegations of a Tron account", () => {
    render(<AccountDetailDelegations account={tronAccount} />);

    expect(screen.getByTestId("tron-votes")).toBeVisible();
  });

  it("renders nothing while the account has no Tron resources yet", () => {
    render(<AccountDetailDelegations account={{ type: "Account" } as AccountLike} />);

    expect(screen.queryByTestId("tron-votes")).toBeNull();
    expect(mockViewModel).not.toHaveBeenCalled();
  });

  it("renders nothing when the view model has nothing to show", () => {
    mockViewModel.mockReturnValue(undefined);

    render(<AccountDetailDelegations account={tronAccount} />);

    expect(screen.queryByTestId("tron-votes")).toBeNull();
  });

  it("renders nothing for a token account", () => {
    render(<AccountDetailDelegations account={{ type: "TokenAccount" } as AccountLike} />);

    expect(screen.queryByTestId("tron-votes")).toBeNull();
  });
});
