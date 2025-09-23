import React from "react";
import { render, screen } from "tests/testSetup";
import ReceiveModal from "./";
import { BTC_ACCOUNT, ETH_ACCOUNT } from "~/newArch/features/__mocks__/accounts.mock";
import { openModal } from "~/renderer/actions/modals";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

jest.mock("@ledgerhq/live-config/LiveConfig", () => ({
  LiveConfig: {
    getValueByKey: jest.fn(),
  },
}));

jest.mock("~/renderer/actions/modals", () => ({
  ...jest.requireActual("~/renderer/actions/modals"),
  openModal: jest.fn().mockReturnValue({ type: "" }),
}));

/**
 * Ensure we always have a #modals container before each render
 */
const ensureModalRoot = () => {
  let modalsRoot = document.getElementById("modals");
  if (!modalsRoot) {
    modalsRoot = document.createElement("div");
    modalsRoot.setAttribute("id", "modals");
    document.body.appendChild(modalsRoot);
  }
};

const setup = (ui = <ReceiveModal />, initialState: Record<string, unknown> = {}) => {
  ensureModalRoot();
  return render(ui, { initialState });
};

describe("ReceiveModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("opens add accounts if no accounts are available", () => {
    setup();

    expect(openModal).toHaveBeenCalledWith("MODAL_ADD_ACCOUNTS", {
      newModalName: "MODAL_RECEIVE",
    });
  });

  it("renders the account step by default", () => {
    setup(<ReceiveModal />, {
      accounts: [ETH_ACCOUNT],
      modals: { MODAL_RECEIVE: { isOpened: true } },
    });

    expect(screen.getByText("Account to credit")).toBeInTheDocument();
  });

  describe("with Noah feature flag", () => {
    const baseState = {
      modals: { MODAL_RECEIVE: { isOpened: true } },
      settings: {
        ...INITIAL_STATE,
        overriddenFeatureFlags: { noah: { enabled: true } },
      },
    };

    test.each`
      label                                   | accountProp    | accounts         | expectedText
      ${"no default account provided"}        | ${undefined}   | ${[ETH_ACCOUNT]} | ${"From a bank account"}
      ${"unsupported account currency"}       | ${BTC_ACCOUNT} | ${[BTC_ACCOUNT]} | ${"Account to credit"}
      ${"supported default account provided"} | ${ETH_ACCOUNT} | ${[BTC_ACCOUNT]} | ${"From a bank account"}
    `("renders correct step when $label", ({ accountProp, accounts, expectedText }) => {
      setup(<ReceiveModal account={accountProp} />, {
        ...baseState,
        accounts,
      });

      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });
});
