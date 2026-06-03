import { BigNumber } from "bignumber.js";
import {
  processTransferProposals,
  groupByDay,
  isValidRestoreModalState,
  INSTRUCTION_TYPE_MAP,
} from "../utils/transferProposals";
import { ACCOUNT_XPUB, createRawProposal, createProcessedProposal, MOCK_UNIT } from "./test-utils";

const OTHER_XPUB = "other-xpub";
const getMockUnit = () => MOCK_UNIT;

describe("processTransferProposals", () => {
  it("should return empty incoming and outgoing arrays when given no proposals", () => {
    const result = processTransferProposals([], ACCOUNT_XPUB, getMockUnit);
    expect(result.incoming).toEqual([]);
    expect(result.outgoing).toEqual([]);
  });

  it("should classify a proposal as incoming when sender differs from accountXpub", () => {
    const raw = createRawProposal("contract-1", OTHER_XPUB, ACCOUNT_XPUB);
    const { incoming, outgoing } = processTransferProposals([raw], ACCOUNT_XPUB, getMockUnit);

    expect(incoming).toHaveLength(1);
    expect(outgoing).toHaveLength(0);
    expect(incoming[0].isIncoming).toBe(true);
  });

  it("should classify a proposal as outgoing when sender matches accountXpub", () => {
    const raw = createRawProposal("contract-2", ACCOUNT_XPUB, OTHER_XPUB);
    const { incoming, outgoing } = processTransferProposals([raw], ACCOUNT_XPUB, getMockUnit);

    expect(outgoing).toHaveLength(1);
    expect(incoming).toHaveLength(0);
    expect(outgoing[0].isIncoming).toBe(false);
  });

  it("should correctly split a mixed list into incoming and outgoing", () => {
    const proposals = [
      createRawProposal("in-1", OTHER_XPUB, ACCOUNT_XPUB),
      createRawProposal("out-1", ACCOUNT_XPUB, OTHER_XPUB),
      createRawProposal("in-2", OTHER_XPUB, ACCOUNT_XPUB),
    ];

    const { incoming, outgoing } = processTransferProposals(proposals, ACCOUNT_XPUB, getMockUnit);

    expect(incoming).toHaveLength(2);
    expect(outgoing).toHaveLength(1);
  });

  it("should mark a proposal as expired when its expiry timestamp is in the past", () => {
    const pastMicros = (Date.now() - 10000) * 1000;
    const raw = createRawProposal("expired-1", OTHER_XPUB, ACCOUNT_XPUB, {
      expires_at_micros: pastMicros,
    });

    const { incoming } = processTransferProposals([raw], ACCOUNT_XPUB, getMockUnit);

    expect(incoming[0].isExpired).toBe(true);
  });

  it("should mark a proposal as not expired when its expiry timestamp is in the future", () => {
    const futureMicros = (Date.now() + 3600000) * 1000;
    const raw = createRawProposal("active-1", OTHER_XPUB, ACCOUNT_XPUB, {
      expires_at_micros: futureMicros,
    });

    const { incoming } = processTransferProposals([raw], ACCOUNT_XPUB, getMockUnit);

    expect(incoming[0].isExpired).toBe(false);
  });

  it("should correctly map raw field names to the ProcessedProposal shape", () => {
    const futureMicros = (Date.now() + 3600000) * 1000;
    const raw = createRawProposal("contract-map", OTHER_XPUB, ACCOUNT_XPUB, {
      expires_at_micros: futureMicros,
      memo: "test memo",
    });

    const { incoming } = processTransferProposals([raw], ACCOUNT_XPUB, getMockUnit);
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
    const raw = createRawProposal("no-memo", OTHER_XPUB, ACCOUNT_XPUB, {
      memo: undefined,
    });

    const { incoming } = processTransferProposals([raw], ACCOUNT_XPUB, getMockUnit);

    expect(incoming[0].memo).toBe("");
  });
});

describe("groupByDay", () => {
  it("should return an empty array when given no proposals", () => {
    expect(groupByDay([])).toEqual([]);
  });

  it("should return a single group for proposals that all expire on the same day", () => {
    const proposals = [
      createProcessedProposal({
        contractId: "contract-1",
        expiresAt: new Date("2025-06-15T10:00:00Z"),
      }),
      createProcessedProposal({
        contractId: "contract-2",
        expiresAt: new Date("2025-06-15T14:00:00Z"),
      }),
    ];

    const result = groupByDay(proposals);

    expect(result).toHaveLength(1);
    expect(result[0].proposals).toHaveLength(2);
  });

  it("should return multiple groups for proposals that expire on different days", () => {
    const proposals = [
      createProcessedProposal({
        contractId: "contract-1",
        expiresAt: new Date("2025-06-15T10:00:00Z"),
      }),
      createProcessedProposal({
        contractId: "contract-2",
        expiresAt: new Date("2025-06-16T10:00:00Z"),
      }),
    ];

    const result = groupByDay(proposals);

    expect(result).toHaveLength(2);
  });

  it("should sort day groups in descending order so the latest day appears first", () => {
    const proposals = [
      createProcessedProposal({
        contractId: "contract-old",
        expiresAt: new Date("2025-06-14T10:00:00Z"),
      }),
      createProcessedProposal({
        contractId: "contract-new",
        expiresAt: new Date("2025-06-16T10:00:00Z"),
      }),
    ];

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

  it("should return false for prototype-chain property names like toString", () => {
    expect(isValidRestoreModalState({ action: "toString", contractId: "contract-1" })).toBe(false);
  });
});

describe("INSTRUCTION_TYPE_MAP", () => {
  it("should map every TransferProposalAction to the correct instruction type", () => {
    expect(INSTRUCTION_TYPE_MAP.accept).toBe("accept-transfer-instruction");
    expect(INSTRUCTION_TYPE_MAP.reject).toBe("reject-transfer-instruction");
    expect(INSTRUCTION_TYPE_MAP.withdraw).toBe("withdraw-transfer-instruction");
  });
});
