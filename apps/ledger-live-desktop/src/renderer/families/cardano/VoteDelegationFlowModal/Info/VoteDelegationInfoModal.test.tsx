import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import VoteDelegationInfoModal from "./VoteDelegationInfoModal";
import { closeModal } from "~/renderer/actions/modals";

jest.mock("~/renderer/actions/modals", () => ({
  closeModal: jest.fn(() => ({ type: "CLOSE_MODAL" })),
}));

jest.mock("~/renderer/components/Modal", () => ({
  __esModule: true,
  default: ({ render }: { render: (props: { onClose: () => void }) => React.ReactNode }) =>
    render({ onClose: jest.fn() }),
  ModalBody: ({ render, title }: { render: () => React.ReactNode; title: React.ReactNode }) => (
    <div>
      <div>{title}</div>
      {render()}
    </div>
  ),
}));

jest.mock("~/renderer/analytics/TrackPage", () => () => null);

describe("VoteDelegationInfoModal", () => {
  const mockOnNext = jest.fn();

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const defaultProps = {
    name: "MODAL_CARDANO_VOTE_DELEGATION_INFO",
    onNext: mockOnNext,
    description: "Test description",
    bullets: ["bullet 1", "bullet 2"],
    additional: <div data-testid="additional-content" />,
    currency: "cardano",
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with a description and bullet points", () => {
    render(<VoteDelegationInfoModal {...defaultProps} />);

    expect(screen.getByText("Test description")).toBeInTheDocument();
    expect(screen.getByText("bullet 1")).toBeInTheDocument();
    expect(screen.getByText("bullet 2")).toBeInTheDocument();
    expect(screen.getByTestId("additional-content")).toBeInTheDocument();
  });

  it("handles DRep option selection", () => {
    render(<VoteDelegationInfoModal {...defaultProps} />);

    const button = screen.getByText("DRep");
    fireEvent.click(button);

    expect(closeModal).toHaveBeenCalledWith("MODAL_CARDANO_VOTE_DELEGATION_INFO");
    expect(mockOnNext).toHaveBeenCalledWith("dRep");
  });

  it("handles the noConfidence option selection", () => {
    render(<VoteDelegationInfoModal {...defaultProps} />);

    const button = screen.getByText(/Always no-confidence/i);
    fireEvent.click(button);

    expect(closeModal).toHaveBeenCalledWith("MODAL_CARDANO_VOTE_DELEGATION_INFO");
    expect(mockOnNext).toHaveBeenCalledWith("noConfidence");
  });

  it("handles the abstain option selection", () => {
    render(<VoteDelegationInfoModal {...defaultProps} />);

    const button = screen.getByText(/Always abstain/i);
    fireEvent.click(button);

    expect(closeModal).toHaveBeenCalledWith("MODAL_CARDANO_VOTE_DELEGATION_INFO");
    expect(mockOnNext).toHaveBeenCalledWith("abstain");
  });
});
