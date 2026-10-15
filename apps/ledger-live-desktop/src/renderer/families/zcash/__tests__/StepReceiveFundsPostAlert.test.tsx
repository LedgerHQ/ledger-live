import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import StepReceiveFundsPostAlert from "../StepReceiveFundsPostAlert";
import type { StepProps } from "~/renderer/modals/Receive/Body";

jest.mock("../ZcashShieldedReceiveBlock", () => ({
  ZcashShieldedReceiveBlock: () => <div data-testid="mock-shielded-block" />,
}));

const makeProps = (currencyId = "zcash"): Partial<StepProps> => ({
  account: {
    ...createFixtureAccount(),
    currency: { id: currencyId, family: "zcash" },
  } as never,
  parentAccount: null,
  device: null,
  isAddressVerified: null,
  onChangeAddressVerified: jest.fn(),
  closeModal: jest.fn(),
  t: ((k: string) => k) as never,
  transitionTo: jest.fn(),
  token: null,
  receiveTokenMode: false,
  verifyAddressError: null,
  onRetry: jest.fn(),
  onSkipConfirm: jest.fn(),
  onResetSkip: jest.fn(),
  onChangeToken: jest.fn(),
  onChangeAccount: jest.fn(),
  onClose: jest.fn(),
  currencyName: currencyId,
});

describe("zcash StepReceiveFundsPostAlert", () => {
  it.each(["zcash", "zcash_testnet"])(
    "renders the shielded block on %s when the flag is enabled",
    currencyId => {
      render(<StepReceiveFundsPostAlert {...(makeProps(currencyId) as StepProps)} />, {
        initialState: withFlagOverrides({ zcashShielded: { enabled: true } }),
      });
      expect(screen.getByTestId("mock-shielded-block")).toBeInTheDocument();
    },
  );

  it("does not render the shielded block when the feature flag is disabled", () => {
    render(<StepReceiveFundsPostAlert {...(makeProps("zcash") as StepProps)} />, {
      initialState: withFlagOverrides({ zcashShielded: { enabled: false } }),
    });
    expect(screen.queryByTestId("mock-shielded-block")).not.toBeInTheDocument();
  });
});
