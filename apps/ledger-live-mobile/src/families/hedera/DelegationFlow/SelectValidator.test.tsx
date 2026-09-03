import React from "react";
import BigNumber from "bignumber.js";
import { Spinner } from "@ledgerhq/lumen-ui-rnative";
import { render, screen, waitFor } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import type { HederaValidatorsQuery } from "@ledgerhq/live-common/families/hedera/react";
import SelectValidator from "./SelectValidator";
import { HEDERA_ACCOUNT_1 } from "../__mocks__/account.mock";

let mockValidatorsQuery: HederaValidatorsQuery;

jest.mock("@ledgerhq/live-common/families/hedera/react", () => ({
  useHederaValidators: () => mockValidatorsQuery,
}));

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate } as never;
const mockRoute = {
  key: "test",
  name: ScreenName.HederaDelegationSelectValidator,
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
  isLedgerNode: false,
};

const overrideInitialState = (state: State): State => ({
  ...state,
  accounts: { ...state.accounts, active: [HEDERA_ACCOUNT_1] },
});

describe("DelegationFlow SelectValidator", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("shows a spinner and no validator row while the validators query is loading", () => {
    mockValidatorsQuery = { validators: [], loading: true, error: null };

    render(<SelectValidator navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState,
    });

    expect(screen.UNSAFE_getByType(Spinner)).toBeTruthy();
    expect(screen.queryByText("Hedera Node 0")).toBeNull();
  });

  it("shows the fetch error text and keeps the list mounted", async () => {
    mockValidatorsQuery = { validators: [], loading: false, error: new Error("network down") };

    render(<SelectValidator navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState,
    });

    await waitFor(() => expect(screen.getByText(/network down/i)).toBeVisible());
  });

  it("does not show an error and navigates to Summary when a validator is selected", async () => {
    mockValidatorsQuery = { validators: [validator], loading: false, error: null };

    const { user } = render(<SelectValidator navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState,
    });

    await waitFor(() => expect(screen.getByText("Hedera Node 0")).toBeVisible());
    expect(screen.queryByText(/network down/i)).toBeNull();

    await user.press(screen.getByText("Hedera Node 0"));

    expect(mockNavigate).toHaveBeenCalledWith(
      ScreenName.HederaDelegationSummary,
      expect.objectContaining({ validator }),
    );
  });
});
