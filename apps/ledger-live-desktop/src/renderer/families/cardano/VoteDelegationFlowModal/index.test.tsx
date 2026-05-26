import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import VoteDelegationModal from "./index";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";

jest.mock("~/renderer/components/Modal", () => {
  return function MockModal({
    render,
    onHide,
    name,
  }: {
    render: (args: { onClose: () => void; data: { account: { id: string } } }) => React.ReactNode;
    onHide: () => void;
    name: string;
  }) {
    return (
      <div data-testid="modal">
        <span>{name}</span>
        <button data-testid="close-modal" onClick={onHide}>
          Close Modal
        </button>
        {render({
          onClose: jest.fn(),
          data: { account: { id: "account-id" } },
        })}
      </div>
    );
  };
});

jest.mock("./Body", () => {
  return function MockBody({
    stepId,
    onChangeStepId,
  }: {
    stepId: string;
    onChangeStepId: (s: string) => void;
  }) {
    return (
      <div data-testid="modal-body">
        <span>Current Step: {stepId}</span>
        <button onClick={() => onChangeStepId("summary")}>Go to summary</button>
      </div>
    );
  };
});

describe("voteDelegationFlowModal", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockAccount = { id: "acc-id" } as unknown as CardanoAccount;

  it("renders correctly with default step", () => {
    render(<VoteDelegationModal account={mockAccount} option="dRep" />);

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText("MODAL_CARDANO_VOTE_DELEGATION")).toBeInTheDocument();
    expect(screen.getByTestId("modal-body")).toBeInTheDocument();
    expect(screen.getByText("Current Step: dRep")).toBeInTheDocument();
  });

  it("handles step change", () => {
    render(<VoteDelegationModal account={mockAccount} option="dRep" />);

    fireEvent.click(screen.getByText("Go to summary"));

    expect(screen.getByText("Current Step: summary")).toBeInTheDocument();
  });

  it("resets state when modal is hidden", () => {
    render(<VoteDelegationModal account={mockAccount} option="dRep" />);

    fireEvent.click(screen.getByText("Go to summary"));
    expect(screen.getByText("Current Step: summary")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("close-modal"));
    expect(screen.getByText("Current Step: dRep")).toBeInTheDocument();
  });
});
