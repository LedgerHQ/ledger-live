/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Unit } from "@domain/entity-currency-unit";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/impl";
import type { ResolvedInstrument } from "@ledgerhq/live-common/families/canton/proposalSorting";
import React from "react";
import { View } from "../index";
import type { PendingTransferProposalsViewModel } from "../usePendingTransferProposalsViewModel";
import { groupByDay, processTransferProposals } from "../utils/transferProposals";
import { ACCOUNT_XPUB, createCantonAccount, createRawProposal, UNKNOWN_UNIT } from "./test-utils";

const CBTC_ID = "canton_network/cip56/cbtc";

// A distinct rate per currency, so the rendered countervalue shows which currency priced the offer.
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useCalculate: ({ from }: { from: { id: string } }) =>
    from.id === "canton_network/cip56/cbtc" ? 7_000_000 : 1_100,
}));

const unit: Unit = { code: "CANTON", magnitude: 38, name: "Canton" };
const mockAccount = createCantonAccount();
const resolveNative = () => ({ unit, currency: mockAccount.currency, isUnknown: false });
const resolveUnknown = () => ({ unit: UNKNOWN_UNIT, isUnknown: true });
const CBTC = {
  type: "TokenCurrency",
  id: CBTC_ID,
  contractAddress: "cbtc-network::1220",
  parentCurrency: mockAccount.currency,
  tokenType: "cip56",
  name: "CBTC",
  ticker: "CBTC",
  units: [{ name: "CBTC", code: "CBTC", magnitude: 38 }],
} as unknown as NonNullable<ResolvedInstrument["currency"]>;
const resolveCalToken = () => ({
  unit: { name: "CBTC", code: "CBTC", magnitude: 38 },
  currency: CBTC,
  isUnknown: false,
});

beforeAll(() => getCurrencyBridge(mockAccount.currency as CryptoCurrency));

const buildIncoming = (
  contractId = "contract-123",
  resolveInstrument: (id: string, admin: string) => ResolvedInstrument = resolveNative,
) => {
  const { incoming } = processTransferProposals(
    [createRawProposal(contractId, "sender-address", ACCOUNT_XPUB)],
    ACCOUNT_XPUB,
    resolveInstrument,
  );
  return { grouped: groupByDay(incoming), count: incoming.length };
};

const buildOutgoing = (contractId = "contract-456") => {
  const { outgoing } = processTransferProposals(
    [createRawProposal(contractId, ACCOUNT_XPUB, "receiver-address")],
    ACCOUNT_XPUB,
    resolveNative,
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
  reonboardDrawer: { isOpen: false },
  onReonboardDrawerClose: jest.fn(),
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

    it("should label an unknown instrument's amount and keep the offer reviewable", () => {
      const onRowClick = jest.fn();
      const { grouped, count } = buildIncoming("foreign-offer", resolveUnknown);
      render(
        <View
          {...buildViewModel({ groupedIncoming: grouped, incomingCount: count, onRowClick })}
        />,
      );
      fireEvent.press(screen.getByText("Review"));
      expect(screen.getByText(/Unknown token/)).toBeTruthy();
      expect(onRowClick).toHaveBeenCalledWith("foreign-offer");
    });

    it("should not label an offer for a known instrument", () => {
      const { grouped, count } = buildIncoming();
      render(<View {...buildViewModel({ groupedIncoming: grouped, incomingCount: count })} />);
      expect(screen.queryByText(/Unknown token/)).toBeNull();
    });

    it("should price a known offer in its own currency", () => {
      const { grouped, count } = buildIncoming();
      render(<View {...buildViewModel({ groupedIncoming: grouped, incomingCount: count })} />);
      expect(screen.getByText(/11\.00/)).toBeTruthy();
    });

    it("should price a CAL token offer in the token's currency, not the account's", () => {
      const { grouped, count } = buildIncoming("token-offer", resolveCalToken);
      render(<View {...buildViewModel({ groupedIncoming: grouped, incomingCount: count })} />);
      expect(screen.getByText(/70,000\.00/)).toBeTruthy();
      expect(screen.queryByText(/11\.00/)).toBeNull();
    });

    it("should show no countervalue for an unknown instrument", () => {
      const { grouped, count } = buildIncoming("foreign-offer", resolveUnknown);
      render(<View {...buildViewModel({ groupedIncoming: grouped, incomingCount: count })} />);
      expect(screen.queryByText(/11\.00|70,000\.00/)).toBeNull();
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
