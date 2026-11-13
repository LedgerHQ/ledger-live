import React from "react";
import BigNumber from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import { render, waitFor } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import RemoveTokenModal from "./index";
import { XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT } from "../__mocks__/account.mock";

const mockStepsBody = jest.fn((_props: object) => null);
jest.mock("../AddTokenModal/Body", () => ({
  __esModule: true,
  default: (props: object) => mockStepsBody(props),
}));

const heldIouAccount = { ...XRP_IOU_TOKEN_ACCOUNT, balance: new BigNumber(25) };
const emptyIouAccount = { ...XRP_IOU_TOKEN_ACCOUNT, balance: new BigNumber(0) };

function renderOpenModal(tokenAccount: TokenAccount) {
  const modalsDiv = document.createElement("div");
  modalsDiv.id = "modals";
  document.body.appendChild(modalsDiv);

  return render(<RemoveTokenModal />, {
    initialState: {
      settings: AFTER_ONBOARDING_STATE,
      modals: {
        MODAL_XRP_REMOVE_TOKEN: { isOpened: true, data: { account: XRP_ACCOUNT, tokenAccount } },
      },
    },
  });
}

afterEach(() => {
  document.getElementById("modals")?.remove();
  mockStepsBody.mockClear();
});

describe("xrp RemoveTokenModal", () => {
  it.each([
    ["an empty", emptyIouAccount],
    ["a held", heldIouAccount],
  ])("starts the remove steps on review for %s token", async (_, tokenAccount) => {
    renderOpenModal(tokenAccount);

    await waitFor(() => {
      expect(mockStepsBody).toHaveBeenLastCalledWith(
        expect.objectContaining({
          stepId: "review",
          params: { account: XRP_ACCOUNT, tokenAccount, remove: true },
        }),
      );
    });
  });
});
