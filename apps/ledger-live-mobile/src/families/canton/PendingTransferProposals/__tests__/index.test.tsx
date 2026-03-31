/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import { View } from "../index";
import type { PendingTransferProposalsViewModel } from "../usePendingTransferProposalsViewModel";
import { groupByDay, processTransferProposals } from "../utils/transferProposals";
import { ACCOUNT_XPUB, createCantonAccount, createRawProposal } from "./test-utils";

const unit: Unit = { code: "CANTON", magnitude: 38, name: "Canton" };
const mockAccount = createCantonAccount();

const buildIncoming = (contractId = "contract-123") => {
  const { incoming } = processTransferProposals(
    [createRawProposal(contractId, "sender-address", ACCOUNT_XPUB)],
    ACCOUNT_XPUB,
  );
  return { grouped: groupByDay(incoming), count: incoming.length };
};

const buildOutgoing = (contractId = "contract-456") => {
  const { outgoing } = processTransferProposals(
    [createRawProposal(contractId, ACCOUNT_XPUB, "receiver-address")],
    ACCOUNT_XPUB,
  );
  return { grouped: groupByDay(outgoing), count: outgoing.length };
};

const buildViewModel = (
  overrides?: Partial<PendingTransferProposalsViewModel>,
): PendingTransferProposalsViewModel => ({
  groupedIncoming: [],
  groupedOutgoing: [],
  incomingCount: 0,
  outgoingCount: 0,
  modal: { isOpen: false, action: "accept", contractId: "" },
  isDetailsOpen: false,
  selectedProposal: null,
  unit,
  appName: "Canton",
  account: mockAccount,
  onRowClick: jest.fn(),
  onOpenModal: jest.fn(),
  onDeviceConfirm: jest.fn(),
  onModalClose: jest.fn(),
  onDetailsClose: jest.fn(),
  ...overrides,
});

describe("PendingTransferProposals View", () => {
  it("should render nothing when there are no proposals", () => {
    const { toJSON } = render(<View {...buildViewModel()} />);
    expect(toJSON()).toBeNull();
  });

  describe("incoming proposals", () => {
    it("should render the incoming section title", () => {
      const { grouped, count } = buildIncoming();
      render(<View {...buildViewModel({ groupedIncoming: grouped, incomingCount: count })} />);
      expect(screen.getByText("Incoming transfer to review")).toBeTruthy();
    });

    it("should show a Review button", () => {
      const { grouped, count } = buildIncoming();
      render(<View {...buildViewModel({ groupedIncoming: grouped, incomingCount: count })} />);
      expect(screen.getByText("Review")).toBeTruthy();
    });

    it("should call onRowClick with the contractId when Review is pressed", () => {
      const onRowClick = jest.fn();
      const { grouped, count } = buildIncoming("contract-123");
      render(
        <View
          {...buildViewModel({ groupedIncoming: grouped, incomingCount: count, onRowClick })}
        />,
      );
      fireEvent.press(screen.getByText("Review"));
      expect(onRowClick).toHaveBeenCalledWith("contract-123");
    });
  });

  describe("outgoing proposals", () => {
    it("should render the outgoing section title", () => {
      const { grouped, count } = buildOutgoing();
      render(<View {...buildViewModel({ groupedOutgoing: grouped, outgoingCount: count })} />);
      expect(screen.getByText("Outgoing transfer")).toBeTruthy();
    });

    it("should show a withdraw button", () => {
      const { grouped, count } = buildOutgoing("contract-456");
      render(<View {...buildViewModel({ groupedOutgoing: grouped, outgoingCount: count })} />);
      expect(screen.getByTestId("withdraw-button-contract-456")).toBeTruthy();
    });

    it("should call onOpenModal with withdraw when the withdraw button is pressed", () => {
      const onOpenModal = jest.fn();
      const { grouped, count } = buildOutgoing("contract-456");
      render(
        <View
          {...buildViewModel({ groupedOutgoing: grouped, outgoingCount: count, onOpenModal })}
        />,
      );
      fireEvent.press(screen.getByTestId("withdraw-button-contract-456"));
      expect(onOpenModal).toHaveBeenCalledWith("contract-456", "withdraw");
    });
  });

  describe("both sections", () => {
    it("should render incoming and outgoing sections simultaneously", () => {
      const incoming = buildIncoming();
      const outgoing = buildOutgoing();
      render(
        <View
          {...buildViewModel({
            groupedIncoming: incoming.grouped,
            incomingCount: incoming.count,
            groupedOutgoing: outgoing.grouped,
            outgoingCount: outgoing.count,
          })}
        />,
      );
      expect(screen.getByText("Review")).toBeTruthy();
      expect(screen.getByTestId("withdraw-button-contract-456")).toBeTruthy();
    });
  });
});
