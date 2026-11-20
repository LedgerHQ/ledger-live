import React from "react";
import { render, screen, userEvent } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import ManageTokenModal, { type Data } from "./index";
import { XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT, makeXrpTokenAccount } from "../__mocks__/account.mock";

const data = { account: XRP_ACCOUNT, tokenAccount: XRP_IOU_TOKEN_ACCOUNT };

function renderOpenModal(modalData: Data = data) {
  const modalsDiv = document.createElement("div");
  modalsDiv.id = "modals";
  document.body.appendChild(modalsDiv);

  return render(<ManageTokenModal {...modalData} />, {
    initialState: {
      settings: AFTER_ONBOARDING_STATE,
      modals: { MODAL_XRP_MANAGE_TOKEN: { isOpened: true, data: modalData } },
    },
  });
}

afterEach(() => {
  document.getElementById("modals")?.remove();
});

describe("xrp ManageTokenModal", () => {
  it.each([
    ["xrp-manage-token-settings", data],
    ["xrp-manage-token-remove", { ...data, remove: true }],
  ] as const)("%s closes the menu and opens the token flow", async (testId, flowData) => {
    const { store } = renderOpenModal();

    const button = await screen.findByTestId(testId);
    await userEvent.click(button);

    const { modals } = store.getState();
    expect(modals.MODAL_XRP_MANAGE_TOKEN?.isOpened).toBeFalsy();
    expect(modals.MODAL_XRP_ADD_TOKEN).toEqual({ isOpened: true, data: flowData });
  });

  it("disables only Remove token on a frozen token, and says why", async () => {
    renderOpenModal({ ...data, tokenAccount: makeXrpTokenAccount({ isLocked: true }) });

    expect(await screen.findByTestId("xrp-manage-token-remove")).toBeDisabled();
    expect(screen.getByText("This token is frozen")).toBeVisible();
    expect(screen.getByTestId("xrp-manage-token-settings")).toBeEnabled();
  });
});
