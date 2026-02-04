import React from "react";
import { render, screen } from "tests/testSetup";
import UndelegationModal from "./index";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";

// Mock Body component
jest.mock("./Body", () => {
  const MockBody = ({
    stepId,
    onChangeStepId,
    onClose,
  }: {
    stepId: string;
    onChangeStepId: (stepId: string) => void;
    onClose: () => void;
  }) => (
    <div data-testid="undelegate-modal-body">
      <div data-testid="step-id">{stepId}</div>
      <button data-testid="change-step-button" onClick={() => onChangeStepId("connectDevice")}>
        Change Step
      </button>
      <button data-testid="close-button" onClick={onClose}>
        Close
      </button>
    </div>
  );
  MockBody.displayName = "MockBody";
  return MockBody;
});

// Mock Modal to just render children
jest.mock("~/renderer/components/Modal", () => {
  const MockModal = ({
    render,
    name,
  }: {
    render: (props: { onClose: () => void; data: object }) => React.ReactNode;
    name: string;
  }) => <div data-testid={`modal-${name}`}>{render({ onClose: jest.fn(), data: {} })}</div>;
  MockModal.displayName = "MockModal";
  return MockModal;
});

const mockAccount = {
  id: "test-account-id",
  currency: { id: "cardano", name: "Cardano", ticker: "ADA" },
} as unknown as CardanoAccount;

describe("UndelegationModal", () => {
  it("renders the modal and its body", () => {
    render(<UndelegationModal account={mockAccount} />);

    expect(screen.getByTestId("modal-MODAL_CARDANO_UNDELEGATE")).toBeInTheDocument();
    expect(screen.getByTestId("undelegate-modal-body")).toBeInTheDocument();
  });

  it("starts at summary step", () => {
    render(<UndelegationModal account={mockAccount} />);
    expect(screen.getByTestId("step-id")).toHaveTextContent("summary");
  });

  it("handles step change", async () => {
    const { user } = render(<UndelegationModal account={mockAccount} />);

    const changeStepButton = screen.getByTestId("change-step-button");
    await user.click(changeStepButton);

    expect(screen.getByTestId("step-id")).toHaveTextContent("connectDevice");
  });
});
