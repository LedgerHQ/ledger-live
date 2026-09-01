import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import VoteDelegation from "./index";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { openModal } from "~/renderer/actions/modals";

jest.mock("~/renderer/actions/modals", () => ({
  openModal: jest.fn(() => ({ type: "OPEN_MODAL" })),
}));

describe("VoteDelegation", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockAccount = {
    type: "Account",
    currency: { name: "Cardano" },
    cardanoResources: {
      delegation: {
        dRepHex: "drep-hex",
      },
    },
  } as CardanoAccount;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders null if account type is not Account", () => {
    const { container } = render(
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      <VoteDelegation account={{ type: "TokenAccount" } as unknown as CardanoAccount} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders table with header and row when delegated", () => {
    render(<VoteDelegation account={mockAccount} />);
    expect(screen.getByText("Vote Delegation")).toBeInTheDocument();
    expect(screen.getByText("drep-hex")).toBeInTheDocument();
  });

  it("renders delegate button when not delegated", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const nonDelegatedAccount = {
      ...mockAccount,
      cardanoResources: {
        delegation: null,
      },
    } as unknown as CardanoAccount;

    render(<VoteDelegation account={nonDelegatedAccount} />);
    expect(screen.getByText(/Delegate your voting power/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Start vote delegation"));
    expect(openModal).toHaveBeenCalledWith("MODAL_CARDANO_VOTE_DELEGATION_INFO", {
      account: nonDelegatedAccount,
    });
  });

  it("renders abstain when dRepHex is 2", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const abstainAccount = {
      ...mockAccount,
      cardanoResources: {
        delegation: { dRepHex: "2" },
      },
    } as unknown as CardanoAccount;

    render(<VoteDelegation account={abstainAccount} />);
    expect(screen.getByText("Always abstain")).toBeInTheDocument();
  });

  it("renders noConfidence when dRepHex is 3", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const noConfidenceAccount = {
      ...mockAccount,
      cardanoResources: {
        delegation: { dRepHex: "3" },
      },
    } as unknown as CardanoAccount;

    render(<VoteDelegation account={noConfidenceAccount} />);
    expect(screen.getByText("Always no-confidence")).toBeInTheDocument();
  });

  it("opens info modal when context menu change is clicked", () => {
    const { container } = render(<VoteDelegation account={mockAccount} />);

    // Click the context menu trigger
    fireEvent.click(container.querySelector("[aria-expanded]")!);

    // Click the "Change Vote Delegation" option
    fireEvent.click(screen.getByText("Change Vote Delegation"));

    expect(openModal).toHaveBeenCalledWith("MODAL_CARDANO_VOTE_DELEGATION_INFO", {
      account: mockAccount,
    });
  });
});
