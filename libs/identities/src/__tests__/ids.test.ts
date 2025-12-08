import { DeviceId, UserId, DatadogId } from "../ids";

type IdClass = typeof DeviceId | typeof UserId | typeof DatadogId;

interface IdTestConfig {
  name: string;
  Class: IdClass;
  redactedPrefix: string;
  exportMethods: Array<{
    method: string;
    testValue: string;
  }>;
}

const idConfigs: IdTestConfig[] = [
  {
    name: "DeviceId",
    Class: DeviceId,
    redactedPrefix: "[DeviceId:REDACTED]",
    exportMethods: [
      { method: "exportDeviceIdForPushDevicesService", testValue: "device-123" },
      { method: "exportDeviceIdForPersistence", testValue: "device-123" },
    ],
  },
  {
    name: "UserId",
    Class: UserId,
    redactedPrefix: "[UserId:REDACTED]",
    exportMethods: [
      { method: "exportUserIdForPushDevicesService", testValue: "user-123" },
      { method: "exportUserIdForPersistence", testValue: "user-123" },
    ],
  },
  {
    name: "DatadogId",
    Class: DatadogId,
    redactedPrefix: "[DatadogId:REDACTED]",
    exportMethods: [{ method: "exportDatadogIdForPersistence", testValue: "datadog-123" }],
  },
];

describe("ID Classes", () => {
  idConfigs.forEach(config => {
    describe(config.name, () => {
      describe("constructor", () => {
        it("should create an instance with valid string", () => {
          const id = new config.Class("test-123");
          expect(id).toBeInstanceOf(config.Class);
        });

        it("should throw error for empty string", () => {
          expect(() => new config.Class("")).toThrow(`${config.name} must be a non-empty string`);
        });

        it("should throw error for whitespace-only string", () => {
          expect(() => new config.Class("   ")).toThrow(
            `${config.name} must be a non-empty string`,
          );
        });
      });

      describe("toString", () => {
        it("should return redacted string", () => {
          const id = new config.Class("test-123");
          expect(id.toString()).toBe(config.redactedPrefix);
        });
      });

      describe("toJSON", () => {
        it("should return redacted string", () => {
          const id = new config.Class("test-123");
          expect(id.toJSON()).toBe(config.redactedPrefix);
        });

        it("should not expose value in JSON.stringify", () => {
          const id = new config.Class("test-123");
          const json = JSON.stringify({ id });
          expect(json).toContain(config.redactedPrefix);
          expect(json).not.toContain("test-123");
        });
      });

      describe("fromString", () => {
        it("should create instance from string", () => {
          const id = config.Class.fromString("test-123");
          expect(id).toBeInstanceOf(config.Class);
        });
      });

      describe("equals", () => {
        it("should return true for same ID", () => {
          const id1 = new config.Class("test-123");
          const id2 = new config.Class("test-123");
          expect(id1.equals(id2)).toBe(true);
        });

        it("should return false for different IDs", () => {
          const id1 = new config.Class("test-123");
          const id2 = new config.Class("test-456");
          expect(id1.equals(id2)).toBe(false);
        });
      });

      config.exportMethods.forEach(({ method, testValue }) => {
        describe(method, () => {
          it("should export the ID", () => {
            const id = new config.Class(testValue);
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            const exported = (id as unknown as { [key: string]: () => string })[method]();
            expect(exported).toBe(testValue);
          });
        });
      });
    });
  });
});
