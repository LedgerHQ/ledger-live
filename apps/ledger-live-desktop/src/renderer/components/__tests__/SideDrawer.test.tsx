import React from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { render, screen } from "tests/testSetup";
import { SideDrawer } from "~/renderer/components/SideDrawer";

describe("SideDrawer", () => {
  let modalsContainer: HTMLDivElement;

  beforeEach(() => {
    modalsContainer = document.createElement("div");
    modalsContainer.id = "modals";
    document.body.appendChild(modalsContainer);
  });

  afterEach(() => modalsContainer.remove());

  it("should let a dialog opened above the drawer receive clicks", async () => {
    const onClose = jest.fn();
    const { user } = render(
      <>
        <SideDrawer isOpen>
          <button type="button">drawer button</button>
        </SideDrawer>
        <Dialog open>
          <DialogContent>
            <button type="button" onClick={onClose}>
              dialog close
            </button>
          </DialogContent>
        </Dialog>
      </>,
      { initialState: { dialogs: { FINISH_POST_ONBOARDING: true } } },
    );

    expect(screen.getByTestId("side-drawer-container")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "dialog close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
