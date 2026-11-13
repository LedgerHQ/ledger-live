import React from "react";
import { render, screen, userEvent } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import ManageTokenModal from "./index";
import { XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT } from "../__mocks__/account.mock";

const data = { account: XRP_ACCOUNT, tokenAccount: XRP_IOU_TOKEN_ACCOUNT };

function renderOpenModal() {
  const modalsDiv = document.createElement("div");
  modalsDiv.id = "modals";
  document.body.appendChild(modalsDiv);

  return render(<ManageTokenModal />, {
    initialState: {
      settings: AFTER_ONBOARDING_STATE,
      modals: { MODAL_XRP_MANAGE_TOKEN: { isOpened: true, data } },
    },
  });
}

afterEach(() => {
  document.getElementById("modals")?.remove();
});

describe("xrp ManageTokenModal", () => {
  it.each([
    ["xrp-manage-token-settings", "MODAL_XRP_ADD_TOKEN"],
    ["xrp-manage-token-remove", "MODAL_XRP_REMOVE_TOKEN"],
  ] as const)("%s closes the menu and opens %s", async (testId, modal) => {
    const { store } = renderOpenModal();

    await userEvent.click(await screen.findByTestId(testId));

    const { modals } = store.getState();
    expect(modals.MODAL_XRP_MANAGE_TOKEN?.isOpened).toBeFalsy();
    expect(modals[modal]).toEqual({ isOpened: true, data });
  });
});
