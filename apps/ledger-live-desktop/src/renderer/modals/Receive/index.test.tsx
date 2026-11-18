import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { openReceiveFlow } from "LLD/features/Receive/openReceiveFlow";
import ReceiveModal from "./index";

jest.mock("LLD/features/Receive/openReceiveFlow", () => ({
  openReceiveFlow: jest.fn(() => ({ type: "TEST_OPEN_RECEIVE_FLOW" })),
}));

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

  it("hands the crypto choice back to the new receive flow, without the options", async () => {
    const state = {
      ...noahEnabledState,
      ...withFlagOverrides({
        noah: { enabled: true, params: { activeCurrencyIds: [BTC_ACCOUNT.currency.id] } },
        newReceiveFlow: { enabled: true },
      }),
    };
    const { user } = render(<ReceiveModal account={BTC_ACCOUNT} sourcePage="Account Page" />, {
      initialState: state,
    });

    await user.click(screen.getByTestId("receive-step-options-crypto"));

    expect(openReceiveFlow).toHaveBeenCalledWith({
      account: BTC_ACCOUNT,
      parentAccount: undefined,
      sourcePage: "Account Page",
      shouldUseReceiveOptions: false,
    });
  });

  it("goes to the account step on the crypto choice when the new receive flow is off", async () => {
    const { user } = render(<ReceiveModal account={BTC_ACCOUNT} />, {
      initialState: noahEnabledState,
    });

    await user.click(screen.getByTestId("receive-step-options-crypto"));

    expect(openReceiveFlow).not.toHaveBeenCalled();
    expect(screen.queryByTestId("receive-step-options")).not.toBeInTheDocument();
  });

  describe("with the new receive flow on", () => {
    const newFlowState = {
      ...noahEnabledState,
      ...withFlagOverrides({
        noah: { enabled: true, params: { activeCurrencyIds: [BTC_ACCOUNT.currency.id] } },
        newReceiveFlow: { enabled: true },
      }),
    };

    it("hands an asset page's crypto choice back with its assets and preselected account", async () => {
      const currencyIds = ["bitcoin", "ethereum"];
      const { user } = render(<ReceiveModal account={BTC_ACCOUNT} currencyIds={currencyIds} />, {
        initialState: newFlowState,
      });

      await user.click(screen.getByTestId("receive-step-options-crypto"));

      expect(openReceiveFlow).toHaveBeenCalledWith({
        currencyIds,
        legacyAccount: { account: BTC_ACCOUNT, parentAccount: undefined },
        shouldUseReceiveOptions: false,
      });
    });

    it("hands an asset page's crypto choice back without an account when it has none", async () => {
      const { user } = render(<ReceiveModal currencyIds={["bitcoin"]} />, {
        initialState: newFlowState,
      });

      await user.click(screen.getByTestId("receive-step-options-crypto"));

      expect(openReceiveFlow).toHaveBeenCalledWith({
        currencyIds: ["bitcoin"],
        legacyAccount: undefined,
        shouldUseReceiveOptions: false,
      });
    });

    it("hands a generic entry's crypto choice back without an account", async () => {
      const { user } = render(<ReceiveModal sourcePage="Portfolio" />, {
        initialState: newFlowState,
      });

      await user.click(screen.getByTestId("receive-step-options-crypto"));

      expect(openReceiveFlow).toHaveBeenCalledWith({
        sourcePage: "Portfolio",
        shouldUseReceiveOptions: false,
      });
    });
  });

  it("shows the options for an asset page with a Noah asset, whatever account it preselects", () => {
    const state = {
      ...noahEnabledState,
      ...withFlagOverrides({
        noah: { enabled: true, params: { activeCurrencyIds: ["ethereum"] } },
      }),
    };
    render(<ReceiveModal account={BTC_ACCOUNT} currencyIds={["bitcoin", "ethereum"]} />, {
      initialState: state,
    });

    expect(screen.getByTestId("receive-step-options")).toBeVisible();
  });
});
