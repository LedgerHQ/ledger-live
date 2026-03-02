import type { Unit } from "@ledgerhq/types-cryptoassets";
import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { View } from "../index";
import type { PendingTransferProposalsViewModel } from "../usePendingTransferProposalsViewModel";
import { groupByDay, processTransferProposals } from "../utils/transferProposals";
import { ACCOUNT_XPUB, createRawProposal } from "./test-utils";

const unit: Unit = { code: "CANTON", magnitude: 38, name: "Canton" };

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
  unit,
  appName: "Canton",
  onRowClick: jest.fn(),
  onOpenModal: jest.fn(),
  onDeviceConfirm: jest.fn(),
  onModalClose: jest.fn(),
  ...overrides,
});

describe("PendingTransferProposals", () => {
  it("renders nothing when there are no proposals", () => {
    const { container } = render(<View {...buildViewModel()} />);
    expect(container).toBeEmptyDOMElement();
  });

  describe("incoming proposals", () => {
    it("shows accept and reject buttons", () => {
      const { grouped, count } = buildIncoming();

      render(<View {...buildViewModel({ groupedIncoming: grouped, incomingCount: count })} />);

      expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    });

    it("calls onOpenModal with accept when accept button is clicked", () => {
      const onOpenModal = jest.fn();
      const { grouped, count } = buildIncoming("contract-123");

      render(
        <View
          {...buildViewModel({ groupedIncoming: grouped, incomingCount: count, onOpenModal })}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /accept/i }));

      expect(onOpenModal).toHaveBeenCalledWith("contract-123", "accept");
    });

    it("calls onOpenModal with reject when reject button is clicked", () => {
      const onOpenModal = jest.fn();
      const { grouped, count } = buildIncoming("contract-123");

      render(
        <View
          {...buildViewModel({ groupedIncoming: grouped, incomingCount: count, onOpenModal })}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /reject/i }));

      expect(onOpenModal).toHaveBeenCalledWith("contract-123", "reject");
    });
  });

  describe("outgoing proposals", () => {
    it("shows cancel button", () => {
      const { grouped, count } = buildOutgoing();

      render(<View {...buildViewModel({ groupedOutgoing: grouped, outgoingCount: count })} />);

      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("calls onOpenModal with withdraw when cancel button is clicked", () => {
      const onOpenModal = jest.fn();
      const { grouped, count } = buildOutgoing("contract-456");

      render(
        <View
          {...buildViewModel({ groupedOutgoing: grouped, outgoingCount: count, onOpenModal })}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onOpenModal).toHaveBeenCalledWith("contract-456", "withdraw");
    });
  });

  describe("both tables", () => {
    it("renders incoming and outgoing tables simultaneously", () => {
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

      expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });
  });
});
