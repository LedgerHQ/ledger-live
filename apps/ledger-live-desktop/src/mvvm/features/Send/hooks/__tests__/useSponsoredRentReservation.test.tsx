import { renderHook } from "tests/testSetup";
import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useSponsoredRentReservation } from "../useSponsoredRentReservation";

const PARENT_ID = "js:2:tron:TPARENT:";
const PAYER = "TPAYER0000000000000000000000000000";

const mockDispatch = jest.fn();
jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => mockDispatch,
}));

// Run the real addPendingOperation against a bare account so the op the hook synthesizes is captured
// exactly as it would land in the store (no live-common barrel mock — requireActual'ing it hits a
// circular-init bug).
let capturedOp: Operation | null = null;
const mockUpdateAccountWithUpdater = jest.fn(
  (
    id: string,
    updater: (acc: { id: string; pendingOperations: Operation[] }) => {
      pendingOperations: Operation[];
    },
  ) => {
    const result = updater({ id, pendingOperations: [] });
    capturedOp = result.pendingOperations[0] ?? null;
    return { type: "UPDATE_ACCOUNT", id };
  },
);
jest.mock("~/renderer/actions/accounts", () => ({
  updateAccountWithUpdater: (id: string, updater: (acc: never) => never) =>
    mockUpdateAccountWithUpdater(id, updater as never),
}));

const parentAccount = {
  type: "Account",
  id: PARENT_ID,
  freshAddress: PARENT_ID,
  currency: { id: "tron" },
};
const tokenAccount = { type: "TokenAccount", id: `${PARENT_ID}+usdt` };

let mockSendFlow: { account: { account: unknown; parentAccount: unknown } };
jest.mock("../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({ state: mockSendFlow }),
}));

let mockSponsored: {
  phase: string;
  order: { payCoinAmt: unknown; payCoinCode?: string } | null;
  payerAddress: string | null;
  paymentTxId: string | null;
};
jest.mock("../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({ state: mockSponsored }),
}));

function polling(overrides?: Partial<typeof mockSponsored>) {
  mockSponsored = {
    phase: SPONSORED_PHASE.POLLING,
    order: { payCoinAmt: "12.5", payCoinCode: "TRX" },
    payerAddress: PAYER,
    paymentTxId: "txA-hash-1",
    ...overrides,
  };
}

function lastReservedOp(): Operation {
  if (!capturedOp) throw new Error("no reservation op captured");
  return capturedOp;
}

describe("useSponsoredRentReservation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOp = null;
    mockSendFlow = { account: { account: tokenAccount, parentAccount } };
    mockSponsored = {
      phase: SPONSORED_PHASE.IDLE,
      order: null,
      payerAddress: null,
      paymentTxId: null,
    };
  });

  it("locks a pending FEES op on the parent account when payment is submitted (POLLING)", () => {
    const { rerender } = renderHook(() => useSponsoredRentReservation());
    polling();
    rerender();

    expect(mockUpdateAccountWithUpdater).toHaveBeenCalledTimes(1);
    expect(mockUpdateAccountWithUpdater.mock.calls[0][0]).toBe(PARENT_ID);
    const op = lastReservedOp();
    expect(op.type).toBe("FEES");
    expect(op.accountId).toBe(PARENT_ID);
    expect(op.hash).toBe("txA-hash-1");
    expect(op.senders).toEqual([PAYER]);
    // 12.5 TRX -> 12_500_000 sun locked as the fee, value 0 (FEES contributes only its fee).
    expect(op.fee.toString()).toBe(new BigNumber("12500000").toString());
    expect(op.value.toString()).toBe("0");
    // No transactionRaw, so getPendingNativeSpent does NOT treat it as sponsored and locks the fee.
    expect(op.transactionRaw).toBeUndefined();
  });

  it("reserves on a submit rejection reconciled to a funds-moved outcome (never entered POLLING)", () => {
    const { rerender } = renderHook(() => useSponsoredRentReservation());
    // DELIVERY_FAILED (or delivered-via-reconcile -> TRANSFER): paid but skipped POLLING; the
    // orchestration still lands paymentTxId on state, so the reservation must fire off that id.
    polling({ phase: SPONSORED_PHASE.FAILED });
    rerender();

    expect(mockUpdateAccountWithUpdater).toHaveBeenCalledTimes(1);
    expect(lastReservedOp().hash).toBe("txA-hash-1");
  });

  it("does not reserve while no paymentTxId is set (pre-payment or definitively-unpaid failure)", () => {
    const { rerender } = renderHook(() => useSponsoredRentReservation());
    for (const phase of [SPONSORED_PHASE.RENT_SIGNING, SPONSORED_PHASE.FAILED]) {
      mockSponsored = {
        phase,
        order: { payCoinAmt: "12.5", payCoinCode: "TRX" },
        payerAddress: PAYER,
        paymentTxId: null,
      };
      rerender();
    }
    expect(mockUpdateAccountWithUpdater).not.toHaveBeenCalled();
  });

  it("fires once for a submission, not on a re-render at the same paymentTxId", () => {
    const { rerender } = renderHook(() => useSponsoredRentReservation());
    polling();
    rerender();
    rerender();
    expect(mockUpdateAccountWithUpdater).toHaveBeenCalledTimes(1);
  });

  it("reserves again when a retry pays under a fresh paymentTxId", () => {
    const { rerender } = renderHook(() => useSponsoredRentReservation());
    polling();
    rerender();

    // A DELIVERY_FAILED retry re-crafts and re-enters POLLING with a new payment id.
    mockSponsored = {
      phase: SPONSORED_PHASE.RENT_SIGNING,
      order: null,
      payerAddress: null,
      paymentTxId: null,
    };
    rerender();
    polling({ paymentTxId: "txA-hash-2" });
    rerender();

    expect(mockUpdateAccountWithUpdater).toHaveBeenCalledTimes(2);
    expect(lastReservedOp().hash).toBe("txA-hash-2");
  });

  it("skips when the order carries a non-numeric payCoinAmt", () => {
    const { rerender } = renderHook(() => useSponsoredRentReservation());
    polling({ order: { payCoinAmt: "not-a-number", payCoinCode: "TRX" } });
    rerender();
    expect(mockUpdateAccountWithUpdater).not.toHaveBeenCalled();
  });

  it("skips when paymentTxId is missing", () => {
    const { rerender } = renderHook(() => useSponsoredRentReservation());
    polling({ paymentTxId: null });
    rerender();
    expect(mockUpdateAccountWithUpdater).not.toHaveBeenCalled();
  });
});
