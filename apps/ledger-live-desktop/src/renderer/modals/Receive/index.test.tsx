import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import ReceiveModal from "./index";

const noahEnabledState = {
  ...withFlagOverrides({
    noah: {
      enabled: true,
      params: { activeCurrencyIds: [BTC_ACCOUNT.currency.id] },
    },
  }),
  accounts: [BTC_ACCOUNT],
};

describe("ReceiveModal", () => {
  it("shows the Noah receive options when Noah is active and no skip flag is passed", () => {
    render(<ReceiveModal account={BTC_ACCOUNT} />, { initialState: noahEnabledState });

    expect(screen.getByTestId("receive-step-options")).toBeVisible();
  });

  it("skips the Noah receive options when shouldUseReceiveOptions is false", () => {
    render(<ReceiveModal account={BTC_ACCOUNT} shouldUseReceiveOptions={false} />, {
      initialState: noahEnabledState,
    });

    expect(screen.queryByTestId("receive-step-options")).not.toBeInTheDocument();
  });
});
