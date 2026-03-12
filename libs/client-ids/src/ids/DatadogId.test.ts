import { DatadogId } from "./DatadogId";

describe("DatadogId", () => {
  describe("constructor", () => {
    it("should throw for null", () => {
      expect(() => new DatadogId(/* @ts-expect-error intentional invalid arg */ null)).toThrow(
        "DatadogId must be a non-empty string",
      );
    });

    it("should throw for undefined", () => {
      expect(() => new DatadogId(/* @ts-expect-error intentional invalid arg */ undefined)).toThrow(
        "DatadogId must be a non-empty string",
      );
    });

    it("should throw for non-string type", () => {
      expect(() => new DatadogId(/* @ts-expect-error intentional invalid arg */ 123)).toThrow(
        "DatadogId must be a non-empty string",
      );
    });
  });

  describe("fromString", () => {
    it("should create instance from valid string", () => {
      const id = DatadogId.fromString("dd-abc-123");
      expect(id).toBeInstanceOf(DatadogId);
      expect(id.exportDatadogIdForRumUser()).toBe("dd-abc-123");
    });
  });

  describe("toString and toJSON", () => {
    it("should return redacted string", () => {
      const id = new DatadogId("secret-id");
      expect(id.toString()).toBe("[DatadogId:REDACTED]");
      expect(id.toJSON()).toBe("[DatadogId:REDACTED]");
    });
  });

  describe("exportDatadogIdForRumUser", () => {
    it("should return raw id", () => {
      const id = new DatadogId("rum-user-id");
      expect(id.exportDatadogIdForRumUser()).toBe("rum-user-id");
    });
  });

  describe("equals", () => {
    it("should return true for same ID", () => {
      const id1 = new DatadogId("same");
      const id2 = new DatadogId("same");
      expect(id1.equals(id2)).toBe(true);
    });

    it("should return false for different IDs", () => {
      const id1 = new DatadogId("id-a");
      const id2 = new DatadogId("id-b");
      expect(id1.equals(id2)).toBe(false);
    });
  });
});
