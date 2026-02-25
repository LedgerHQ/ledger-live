import { readFileSync } from "fs";
import { join } from "path";
import * as idsModule from "./index";

// Load export-rules.json to discover ID classes and their export methods
const exportRulesPath = join(__dirname, "../../export-rules.json");
const exportRules = JSON.parse(readFileSync(exportRulesPath, "utf-8"));

interface IdTestConfig {
  name: string;
  Class: any;
  redactedPrefix: string;
  exportMethods: string[];
}

// Discover ID classes from export-rules.json
// Pattern: libs/client-ids/src/ids/DeviceId.ts => DeviceId class
const idConfigs: IdTestConfig[] = [];

for (const [filePath, methods] of Object.entries(exportRules)) {
  // Match files in libs/client-ids/src/ids/*.ts
  const idsFileMatch = filePath.match(/libs\/client-ids\/src\/ids\/(\w+)\.ts$/);
  if (idsFileMatch) {
    const className = idsFileMatch[1];
    const Class = (idsModule as any)[className];

    if (Class) {
      const methodsObj = methods;
      const exportMethods =
        methodsObj && typeof methodsObj === "object" ? Object.keys(methodsObj) : [];
      idConfigs.push({
        name: className,
        Class,
        redactedPrefix: `[${className}:REDACTED]`,
        exportMethods,
      });
    }
  }
}

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

      config.exportMethods.forEach(method => {
        describe(method, () => {
          it("should export the ID", () => {
            const testValue = "test-123";
            const id = new config.Class(testValue);
            // Access method dynamically without type assertion
            const exportMethod = id[method];
            if (typeof exportMethod === "function") {
              const exported = exportMethod.call(id);
              expect(exported).toBe(testValue);
            } else {
              throw new Error(`Method ${method} not found on ${config.name}`);
            }
          });
        });
      });
    });
  });
});
