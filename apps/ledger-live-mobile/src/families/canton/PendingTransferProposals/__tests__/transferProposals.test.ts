/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import {
  processTransferProposals,
  groupByDay,
  isValidRestoreModalState,
  INSTRUCTION_TYPE_MAP,
} from "../utils/transferProposals";
import type { ProcessedProposal, RawTransferProposal } from "../types";

const ACCOUNT_XPUB = "account-xpub";
const OTHER_XPUB = "other-xpub";

const buildRawProposal = (overrides: {
  contract_id: string;
  sender: string;
  receiver: string;
  expires_at_micros?: number;
  memo?: string;
}) => ({
  amount: "1000000",
  instrument_id: "instrument-1",
  instrument_admin: "",
  update_id: "",
  expires_at_micros: Date.now() * 1000 + 3600000000,
  memo: "",
  ...overrides,
});

describe("processTransferProposals", () => {
  it("should return empty incoming and outgoing arrays when given no proposals", () => {
    const result = processTransferProposals([], ACCOUNT_XPUB);
    expect(result.incoming).toEqual([]);
    expect(result.outgoing).toEqual([]);
  });

  it("should classify a proposal as incoming when sender differs from accountXpub", () => {
    const raw = buildRawProposal({
      contract_id: "contract-1",
      sender: OTHER_XPUB,
      receiver: ACCOUNT_XPUB,
    });

    const { incoming, outgoing } = processTransferProposals([raw], ACCOUNT_XPUB);

    expect(incoming).toHaveLength(1);
    expect(outgoing).toHaveLength(0);
    expect(incoming[0].isIncoming).toBe(true);
  });

  it("should classify a proposal as outgoing when sender matches accountXpub", () => {
    const raw = buildRawProposal({
      contract_id: "contract-2",
      sender: ACCOUNT_XPUB,
      receiver: OTHER_XPUB,
    });

    const { incoming, outgoing } = processTransferProposals([raw], ACCOUNT_XPUB);

    expect(outgoing).toHaveLength(1);
    expect(incoming).toHaveLength(0);
    expect(outgoing[0].isIncoming).toBe(false);
  });

  it("should correctly split a mixed list into incoming and outgoing", () => {
    const proposals = [
      buildRawProposal({ contract_id: "in-1", sender: OTHER_XPUB, receiver: ACCOUNT_XPUB }),
      buildRawProposal({ contract_id: "out-1", sender: ACCOUNT_XPUB, receiver: OTHER_XPUB }),
      buildRawProposal({ contract_id: "in-2", sender: OTHER_XPUB, receiver: ACCOUNT_XPUB }),
    ];

    const { incoming, outgoing } = processTransferProposals(proposals, ACCOUNT_XPUB);

    expect(incoming).toHaveLength(2);
    expect(outgoing).toHaveLength(1);
  });

  it("should mark a proposal as expired when its expiry timestamp is in the past", () => {
    const pastMicros = (Date.now() - 10000) * 1000;
    const raw = buildRawProposal({
      contract_id: "expired-1",
      sender: OTHER_XPUB,
      receiver: ACCOUNT_XPUB,
      expires_at_micros: pastMicros,
    });

    const { incoming } = processTransferProposals([raw], ACCOUNT_XPUB);

    expect(incoming[0].isExpired).toBe(true);
  });

  it("should mark a proposal as not expired when its expiry timestamp is in the future", () => {
    const futureMicros = (Date.now() + 3600000) * 1000;
    const raw = buildRawProposal({
      contract_id: "active-1",
      sender: OTHER_XPUB,
      receiver: ACCOUNT_XPUB,
      expires_at_micros: futureMicros,
    });

    const { incoming } = processTransferProposals([raw], ACCOUNT_XPUB);

    expect(incoming[0].isExpired).toBe(false);
  });

  it("should correctly map raw field names to the ProcessedProposal shape", () => {
    const futureMicros = (Date.now() + 3600000) * 1000;
    const raw = buildRawProposal({
      contract_id: "contract-map",
      sender: OTHER_XPUB,
      receiver: ACCOUNT_XPUB,
      expires_at_micros: futureMicros,
      memo: "test memo",
    });

    const { incoming } = processTransferProposals([raw], ACCOUNT_XPUB);
    const proposal = incoming[0];

    expect(proposal.contractId).toBe("contract-map");
    expect(proposal.sender).toBe(OTHER_XPUB);
    expect(proposal.receiver).toBe(ACCOUNT_XPUB);
    expect(proposal.amount).toEqual(new BigNumber("1000000"));
    expect(proposal.memo).toBe("test memo");
    expect(proposal.expiresAtMicros).toBe(futureMicros);
    expect(proposal.expiresAt).toBeInstanceOf(Date);
    expect(proposal.day).toBeInstanceOf(Date);
  });

  it("should default memo to an empty string when it is null or undefined", () => {
    const raw = {
      ...buildRawProposal({
        contract_id: "no-memo",
        sender: OTHER_XPUB,
        receiver: ACCOUNT_XPUB,
      }),
      memo: undefined,
    };

    const { incoming } = processTransferProposals(
      [raw as unknown as RawTransferProposal],
      ACCOUNT_XPUB,
    );

    expect(incoming[0].memo).toBe("");
  });
});

describe("groupByDay", () => {
  const makeProposal = (contractId: string, expiresAt: Date): ProcessedProposal => {
    const day = new Date(expiresAt);
    day.setUTCHours(0, 0, 0, 0);
    return {
      contractId,
      sender: OTHER_XPUB,
      receiver: ACCOUNT_XPUB,
      amount: new BigNumber("1000000"),
      instrumentId: "instrument-1",
      memo: "",
      expiresAtMicros: expiresAt.getTime() * 1000,
      isExpired: false,
      isIncoming: true,
      expiresAt,
      day,
    };
  };

  it("should return an empty array when given no proposals", () => {
    expect(groupByDay([])).toEqual([]);
  });

  it("should return a single group for proposals that all expire on the same day", () => {
    const date = new Date("2025-06-15T10:00:00Z");
    const proposals = [
      makeProposal("contract-1", date),
      makeProposal("contract-2", new Date("2025-06-15T14:00:00Z")),
    ];

    const result = groupByDay(proposals);

    expect(result).toHaveLength(1);
    expect(result[0].proposals).toHaveLength(2);
  });

  it("should return multiple groups for proposals that expire on different days", () => {
    const day1 = new Date("2025-06-15T10:00:00Z");
    const day2 = new Date("2025-06-16T10:00:00Z");
    const proposals = [makeProposal("contract-1", day1), makeProposal("contract-2", day2)];

    const result = groupByDay(proposals);

    expect(result).toHaveLength(2);
  });

  it("should sort day groups in descending order so the latest day appears first", () => {
    const earlier = new Date("2025-06-14T10:00:00Z");
    const later = new Date("2025-06-16T10:00:00Z");
    const proposals = [makeProposal("contract-old", earlier), makeProposal("contract-new", later)];

    const result = groupByDay(proposals);

    expect(result[0].day.getTime()).toBeGreaterThan(result[1].day.getTime());
  });
});

describe("isValidRestoreModalState", () => {
  it("should return true for a valid RestoreModalState object", () => {
    expect(isValidRestoreModalState({ action: "accept", contractId: "contract-1" })).toBe(true);
    expect(isValidRestoreModalState({ action: "reject", contractId: "contract-2" })).toBe(true);
    expect(isValidRestoreModalState({ action: "withdraw", contractId: "contract-3" })).toBe(true);
  });

  it("should return false when the value is null", () => {
    expect(isValidRestoreModalState(null)).toBe(false);
  });

  it("should return false when the value is not an object", () => {
    expect(isValidRestoreModalState("accept")).toBe(false);
    expect(isValidRestoreModalState(42)).toBe(false);
    expect(isValidRestoreModalState(undefined)).toBe(false);
  });

  it("should return false when the action field is missing", () => {
    expect(isValidRestoreModalState({ contractId: "contract-1" })).toBe(false);
  });

  it("should return false when the contractId field is missing", () => {
    expect(isValidRestoreModalState({ action: "accept" })).toBe(false);
  });

  it("should return false when the action is not a valid TransferProposalAction", () => {
    expect(isValidRestoreModalState({ action: "unknown", contractId: "contract-1" })).toBe(false);
    expect(isValidRestoreModalState({ action: "", contractId: "contract-1" })).toBe(false);
  });

  it("should return false when contractId is not a string", () => {
    expect(isValidRestoreModalState({ action: "accept", contractId: 123 })).toBe(false);
  });
});

describe("INSTRUCTION_TYPE_MAP", () => {
  it("should map every TransferProposalAction to the correct instruction type", () => {
    expect(INSTRUCTION_TYPE_MAP.accept).toBe("accept-transfer-instruction");
    expect(INSTRUCTION_TYPE_MAP.reject).toBe("reject-transfer-instruction");
    expect(INSTRUCTION_TYPE_MAP.withdraw).toBe("withdraw-transfer-instruction");
  });
});
