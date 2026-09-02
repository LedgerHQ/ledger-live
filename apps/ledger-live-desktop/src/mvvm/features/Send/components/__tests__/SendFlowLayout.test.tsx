/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { mockContact } from "@domain/entity-contact/schema.mock";
import { SendFlowLayout } from "../SendFlowLayout";
import { useFlowWizard } from "../../../FlowWizard/FlowWizardContext";
import { useSendFlowData } from "../../context/SendFlowContext";
import { useSendFlowTracking } from "../../context/SendFlowTrackingContext";
import { useRecipientContactSelection } from "../../context/RecipientContactSelectionContext";
import { track } from "~/renderer/analytics/segment";

jest.mock("../../../FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: jest.fn(),
}));
jest.mock("../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
}));
jest.mock("../../context/SendFlowTrackingContext", () => ({
  useSendFlowTracking: jest.fn(),
}));
jest.mock("../../context/RecipientContactSelectionContext", () => ({
  useRecipientContactSelection: jest.fn(),
}));
jest.mock("../../context/RecipientScannerContext", () => ({
  RecipientScannerProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("../SendHeader", () => ({ SendHeader: () => null }));
jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
}));
jest.mock("@ledgerhq/lumen-ui-react", () => ({
  ...jest.requireActual("@ledgerhq/lumen-ui-react"),
  Dialog: ({
    onOpenChange,
    children,
  }: {
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
  }) => (
    <div>
      <button type="button" onClick={() => onOpenChange(false)}>
        dismiss dialog
      </button>
      {children}
    </div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("SendFlowLayout", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFlowWizard as jest.Mock).mockReturnValue({
      currentStep: SEND_FLOW_STEP.RECIPIENT,
      currentStepConfig: { height: "fixed" },
      currentStepRenderer: () => null,
    });
    (useSendFlowData as jest.Mock).mockReturnValue({
      state: {
        account: { account: null, parentAccount: null },
        flowStatus: "idle",
      },
    });
    (useSendFlowTracking as jest.Mock).mockReturnValue({
      recipientType: "contact",
    });
    (useRecipientContactSelection as jest.Mock).mockReturnValue({
      selectedContact: undefined,
    });
  });

  it("tracks close as select contact address when dismissing the nested address picker", () => {
    (useRecipientContactSelection as jest.Mock).mockReturnValue({
      selectedContact: mockContact({ name: "Benoit" }),
    });

    render(<SendFlowLayout isOpen onClose={onClose} />);
    screen.getByRole("button", { name: "dismiss dialog" }).click();

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "close",
        page: "select contact address",
        recipientType: "contact",
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("tracks close as step recipient when no contact address is being selected", () => {
    render(<SendFlowLayout isOpen onClose={onClose} />);
    screen.getByRole("button", { name: "dismiss dialog" }).click();

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "close",
        page: "step recipient",
      }),
    );
  });
});
