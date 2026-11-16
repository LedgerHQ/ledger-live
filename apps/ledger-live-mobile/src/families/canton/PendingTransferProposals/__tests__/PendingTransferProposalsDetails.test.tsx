import { render, screen } from "@tests/test-renderer";
import React from "react";
import { View } from "../PendingTransferProposalsDetails";
import { createProcessedProposal, MOCK_UNIT, UNKNOWN_UNIT } from "./test-utils";

const buildProps = (proposal = createProcessedProposal()) => ({
  proposal,
  unit: MOCK_UNIT,
  timeRemaining: "1h 00m",
  isExpired: false,
  handleAction: jest.fn(),
  handleCopy: jest.fn(),
  isOpen: true,
});

describe("PendingTransferProposalsDetails View", () => {
  it("should label an unknown instrument's amount and show its id and admin", () => {
    const proposal = createProcessedProposal({
      isUnknownInstrument: true,
      unit: UNKNOWN_UNIT,
      instrumentId: "\u202ECBTC",
      instrumentAdmin: "impostor::1220",
    });

    render(<View {...buildProps(proposal)} />);

    expect(screen.getByText(/Unknown token/)).toBeTruthy();
    expect(screen.getByText("Instrument ID")).toBeTruthy();
    expect(screen.getByText("CBTC")).toBeTruthy();
    expect(screen.getByText("Instrument admin")).toBeTruthy();
    expect(screen.getByText("impostor::1220")).toBeTruthy();
  });

  it("should show no instrument details for a known instrument", () => {
    render(<View {...buildProps()} />);

    expect(screen.queryByText(/Unknown token/)).toBeNull();
    expect(screen.queryByText("Instrument admin")).toBeNull();
  });
});
