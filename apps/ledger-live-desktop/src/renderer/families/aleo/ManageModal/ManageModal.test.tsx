import React from "react";
import { render, screen, userEvent } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";
import { AleoCustomModal } from "../constants";
import ManageModal from "./ManageModal";

jest.mock("@ledgerhq/crypto-icons", () => ({ CryptoIcon: jest.fn() }));

function setup() {
  const modalsDiv = document.createElement("div");
  modalsDiv.id = "modals";
  document.body.appendChild(modalsDiv);

  return render(<ManageModal account={ALEO_MAIN_ACCOUNT} />, {
    initialState: {
      settings: AFTER_ONBOARDING_STATE,
      modals: {
        [AleoCustomModal.MANAGE]: {
          isOpened: true,
          data: { account: ALEO_MAIN_ACCOUNT, parentAccount: null },
        },
      },
    },
  });
}

afterEach(() => {
  document.getElementById("modals")?.remove();
});

describe("Aleo ManageModal", () => {
  // The rows are shown so the modal describes the whole staking lifecycle, but none of the
  // flows are built. A row that looked clickable would open nothing at all.
  it.each(["aleo-bond-button", "aleo-unbond-button", "aleo-claim-button"])(
    "leaves %s disabled",
    async testId => {
      setup();

      expect(await screen.findByTestId(testId)).toBeDisabled();
    },
  );

  it("does not open any flow from the rows", async () => {
    const { store } = setup();

    await userEvent.click(await screen.findByTestId("aleo-bond-button"));
    await userEvent.click(await screen.findByTestId("aleo-unbond-button"));
    await userEvent.click(await screen.findByTestId("aleo-claim-button"));

    const openedModals = Object.entries(store.getState().modals)
      .filter(([, state]) => state?.isOpened)
      .map(([name]) => name);

    expect(openedModals).toEqual([AleoCustomModal.MANAGE]);
  });
});
