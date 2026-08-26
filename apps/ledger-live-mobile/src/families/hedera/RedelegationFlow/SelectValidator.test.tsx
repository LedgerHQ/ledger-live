import React from "react";
import BigNumber from "bignumber.js";
import { renderWithReactQuery as render, screen, waitFor } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import RedelegationSelectValidator from "./SelectValidator";
import { HEDERA_ACCOUNT_1 } from "../__mocks__/account.mock";

let validatorsQueryFn: () => Promise<unknown>;

jest.mock("@ledgerhq/live-common/families/hedera/react", () => ({
  hederaQueries: {
    validatorsList: () => ({
      queryKey: ["mock-hedera-validators"],
      queryFn: () => validatorsQueryFn(),
      retry: false,
    }),
  },
}));

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate } as never;
const mockRoute = {
  key: "test",
  name: ScreenName.HederaRedelegationSelectValidator,
  params: { accountId: HEDERA_ACCOUNT_1.id },
} as never;

const validator = {
  id: "0",
  name: "Hedera Node 0",
  address: "0.0.3",
  addressChecksum: null,
  minStake: new BigNumber(0),
  maxStake: new BigNumber(250_000_000_000_000_000),
  activeStake: new BigNumber(0),
  activeStakePercentage: new BigNumber(0),
  overstaked: false,
};

const overrideInitialState = (state: State): State => ({
  ...state,
  accounts: { ...state.accounts, active: [HEDERA_ACCOUNT_1] },
});

describe("RedelegationFlow SelectValidator", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("shows the fetch error text and keeps the list mounted", async () => {
    validatorsQueryFn = () => Promise.reject(new Error("network down"));

    render(<RedelegationSelectValidator navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState,
    });

    await waitFor(() => expect(screen.getByText(/network down/i)).toBeVisible());
  });

  it("does not show an error and navigates to Amount when a validator is selected", async () => {
    validatorsQueryFn = () => Promise.resolve([validator]);

    const { user } = render(
      <RedelegationSelectValidator navigation={mockNavigation} route={mockRoute} />,
      { overrideInitialState },
    );

    await waitFor(() => expect(screen.getByText("Hedera Node 0")).toBeVisible());
    expect(screen.queryByText(/network down/i)).toBeNull();

    await user.press(screen.getByText("Hedera Node 0"));

    expect(mockNavigate).toHaveBeenCalledWith(
      ScreenName.HederaRedelegationAmount,
      expect.objectContaining({ selectedValidator: validator }),
    );
  });
});
