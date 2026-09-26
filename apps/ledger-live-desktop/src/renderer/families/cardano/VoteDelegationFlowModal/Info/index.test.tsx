import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import CardanoVoteDelegationInfoModal from "./index";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { openModal, closeModal } from "~/renderer/actions/modals";

jest.mock("~/renderer/actions/modals", () => ({
  openModal: jest.fn(() => ({ type: "OPEN_MODAL" })),
  closeModal: jest.fn(() => ({ type: "CLOSE_MODAL" })),
}));

jest.mock("./VoteDelegationInfoModal", () => ({
  __esModule: true,
  default: ({ onNext }: { onNext: (opt: string) => void }) => (
    <div data-testid="info-modal">
      <button data-testid="next-drep" onClick={() => onNext("dRep")}>
        Next DRep
      </button>
      <button data-testid="next-abstain" onClick={() => onNext("abstain")}>
        Next Abstain
      </button>
    </div>
  ),
}));

describe("CardanoVoteDelegationInfoModal", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockAccount = { id: "acc-id" } as CardanoAccount;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly and handles the onNext callback", () => {
    render(<CardanoVoteDelegationInfoModal account={mockAccount} />);
    expect(screen.getByTestId("info-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("next-drep"));

    expect(closeModal).toHaveBeenCalledWith("MODAL_CARDANO_VOTE_DELEGATION_INFO");
    expect(openModal).toHaveBeenCalledWith("MODAL_CARDANO_VOTE_DELEGATION", {
      account: mockAccount,
      option: "dRep",
    });
  });

  it("handles the selection of the abstain option", () => {
    render(<CardanoVoteDelegationInfoModal account={mockAccount} />);
    fireEvent.click(screen.getByTestId("next-abstain"));

    expect(openModal).toHaveBeenCalledWith("MODAL_CARDANO_VOTE_DELEGATION", {
      account: mockAccount,
      option: "abstain",
    });
  });
});
