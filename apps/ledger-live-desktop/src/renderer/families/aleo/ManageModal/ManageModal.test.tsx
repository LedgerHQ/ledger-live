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
  it("hands over to the bond flow when the bond row is clicked", async () => {
    const { store } = setup();

    await userEvent.click(await screen.findByTestId("aleo-bond-button"));

    expect(store.getState().modals[AleoCustomModal.BOND_PUBLIC]).toEqual({
      isOpened: true,
      data: { account: ALEO_MAIN_ACCOUNT },
    });
    expect(store.getState().modals[AleoCustomModal.MANAGE]?.isOpened).toBeFalsy();
  });

  it.each(["aleo-unbond-button", "aleo-claim-button"])("leaves %s disabled", async testId => {
    setup();

    expect(await screen.findByTestId(testId)).toBeDisabled();
  });

  it("opens no flow from the unbond or claim rows", async () => {
    const { store } = setup();

    await userEvent.click(await screen.findByTestId("aleo-unbond-button"));
    await userEvent.click(await screen.findByTestId("aleo-claim-button"));

    const openedModals = Object.entries(store.getState().modals)
      .filter(([, state]) => state?.isOpened)
      .map(([name]) => name);

    expect(openedModals).toEqual([AleoCustomModal.MANAGE]);
  });
});
