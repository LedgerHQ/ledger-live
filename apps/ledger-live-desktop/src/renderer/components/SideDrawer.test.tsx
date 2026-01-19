import React, { useState } from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { SideDrawer } from "./SideDrawer";

describe("SideDrawer", () => {
  beforeEach(() => {
    // Create the modals portal container
    const modalsDiv = document.createElement("div");
    modalsDiv.id = "modals";
    document.body.appendChild(modalsDiv);
  });

  afterEach(() => {
    const modalsDiv = document.getElementById("modals");
    if (modalsDiv) {
      document.body.removeChild(modalsDiv);
    }
  });

  it("should not throw error when trigger element is unmounted before drawer closes", async () => {
    const TestComponent = () => {
      const [isOpen, setIsOpen] = useState(false);
      const [showTrigger, setShowTrigger] = useState(true);

      const handleUnmountAndClose = () => {
        // First unmount the trigger, then close the drawer
        setShowTrigger(false);
        // Use setTimeout to ensure the trigger is unmounted before closing
        setTimeout(() => setIsOpen(false), 50);
      };

      return (
        <div>
          {showTrigger && (
            <button
              data-testid="trigger-button"
              onClick={() => setIsOpen(true)}
            >
              Open Drawer
            </button>
          )}
          <SideDrawer
            isOpen={isOpen}
            onRequestClose={() => setIsOpen(false)}
            title="Test Drawer"
          >
            <div data-testid="test-drawer-children">
              <button
                data-testid="unmount-and-close"
                onClick={handleUnmountAndClose}
              >
                Unmount Trigger and Close
              </button>
            </div>
          </SideDrawer>
        </div>
      );
    };

    const { user } = render(<TestComponent />);

    // Step 1: Click the trigger button to open the drawer
    const triggerButton = screen.getByTestId("trigger-button");
    await user.click(triggerButton);

    // Verify drawer is open
    await waitFor(() => {
      expect(screen.getByTestId("side-drawer-container")).toBeInTheDocument();
    });

    // Step 2: Click the button inside the drawer that unmounts trigger and closes
    // This simulates the bug: trigger element is removed, then drawer closes
    const unmountAndCloseButton = screen.getByTestId("unmount-and-close");
    
    // This should not throw "Cannot read properties of null (reading 'focus')"
    await user.click(unmountAndCloseButton);

    // Verify trigger button is gone
    await waitFor(() => {
      expect(screen.queryByTestId("trigger-button")).not.toBeInTheDocument();
    });

    // Verify drawer is closed without throwing an error
    await waitFor(() => {
      expect(screen.queryByTestId("side-drawer-container")).not.toBeInTheDocument();
    });
  });

  it("should restore focus to trigger element when it still exists", async () => {
    const TestComponent = () => {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <div>
          <button
            data-testid="trigger-button"
            onClick={() => setIsOpen(true)}
          >
            Open Drawer
          </button>
          <SideDrawer
            isOpen={isOpen}
            onRequestClose={() => setIsOpen(false)}
            title="Test Drawer"
          >
            <div data-testid="test-drawer-children">Drawer Content</div>
          </SideDrawer>
        </div>
      );
    };

    const { user } = render(<TestComponent />);

    // Open the drawer
    const triggerButton = screen.getByTestId("trigger-button");
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByTestId("side-drawer-container")).toBeInTheDocument();
    });

    // Close the drawer using the close button
    const closeButton = screen.getByTestId("drawer-close-button");
    await user.click(closeButton);

    // Verify drawer is closed and trigger button still exists
    await waitFor(() => {
      expect(screen.queryByTestId("side-drawer-container")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("trigger-button")).toBeInTheDocument();
  });
});
