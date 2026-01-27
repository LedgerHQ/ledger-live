import { determineOperationType } from "./operationType";

describe("determineOperationType", () => {
  const mockSenders = ["party123"];
  const mockPartyId = "party123";

  describe("transfer-specific operation types", () => {
    it("should return TRANSFER_PROPOSAL when operationType is transfer-proposal", () => {
      const result = determineOperationType("transfer-proposal", "Send", "100", mockSenders, mockPartyId);
      expect(result).toBe("TRANSFER_PROPOSAL");
    });

    it("should return TRANSFER_REJECTED when operationType is transfer-rejected", () => {
      const result = determineOperationType("transfer-rejected", "Send", "100", mockSenders, mockPartyId);
      expect(result).toBe("TRANSFER_REJECTED");
    });

    it("should return TRANSFER_WITHDRAWN when operationType is transfer-withdrawn", () => {
      const result = determineOperationType("transfer-withdrawn", "Send", "100", mockSenders, mockPartyId);
      expect(result).toBe("TRANSFER_WITHDRAWN");
    });

    it("should prioritize operationType over transaction type", () => {
      const result = determineOperationType("transfer-proposal", "Send", "0", mockSenders, mockPartyId);
      expect(result).toBe("TRANSFER_PROPOSAL");
    });
  });

  describe("Send transaction type", () => {
    it("should return FEES when transferValue is 0", () => {
      const result = determineOperationType(undefined, "Send", "0", mockSenders, mockPartyId);
      expect(result).toBe("FEES");
    });

    it("should return OUT when sender includes partyId", () => {
      const result = determineOperationType(undefined, "Send", "100", ["party123"], "party123");
      expect(result).toBe("OUT");
    });

    it("should return IN when sender does not include partyId", () => {
      const result = determineOperationType(undefined, "Send", "100", ["party456"], "party123");
      expect(result).toBe("IN");
    });
  });

  describe("other transaction types", () => {
    it("should return IN for Receive transaction type", () => {
      const result = determineOperationType(undefined, "Receive", "100", mockSenders, mockPartyId);
      expect(result).toBe("IN");
    });

    it("should return PRE_APPROVAL for Initialize transaction type", () => {
      const result = determineOperationType(undefined, "Initialize", "100", mockSenders, mockPartyId);
      expect(result).toBe("PRE_APPROVAL");
    });

    it("should return UNKNOWN for unmapped transaction types", () => {
      const result = determineOperationType(undefined, "Unknown", "100", mockSenders, mockPartyId);
      expect(result).toBe("UNKNOWN");
    });
  });
});
