import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { StorageLockedError } from "@shared/storage";
import { describeLockedStorageContract, describeStorageContract } from "@shared/storage/testing";
import { createNodeFileStorage } from "../createNodeFileStorage";

let directory: string;
let fileIndex = 0;

const nextFilePath = () => path.join(directory, `app-${fileIndex++}.json`);
const readJson = (filePath: string) => JSON.parse(readFileSync(filePath, "utf-8"));
const modeOf = (filePath: string) => statSync(filePath).mode & 0o777;
// Windows has no POSIX file modes.
const describeWithFileModes = process.platform === "win32" ? describe.skip : describe;

beforeAll(() => {
  directory = mkdtempSync(path.join(tmpdir(), "storage-node-file-"));
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describeStorageContract("node file", () => createNodeFileStorage({ filePath: nextFilePath() }));

describeLockedStorageContract("node file", () => {
  const filePath = nextFilePath();
  writeFileSync(
    filePath,
    JSON.stringify({ data: { vault: "ciphertext", history: { lastSeenOperationDate: null } } }),
  );
  return {
    storage: createNodeFileStorage({ filePath, encryptedKeys: ["vault"] }),
    encryptedKey: "vault",
    plainKey: "history",
  };
});

describe("createNodeFileStorage", () => {
  it("returns undefined when the file is missing", async () => {
    const storage = createNodeFileStorage({ filePath: nextFilePath() });
    await expect(storage.get("vault")).resolves.toBeUndefined();
  });

  it("creates the file under data on the first write", async () => {
    const filePath = nextFilePath();
    const storage = createNodeFileStorage({ filePath });

    await storage.set("vault", []);

    expect(readJson(filePath)).toEqual({ data: { vault: [] } });
  });

  it("keeps the other keys and the other top-level fields of the file", async () => {
    const filePath = nextFilePath();
    writeFileSync(filePath, JSON.stringify({ data: { settings: { a: 1 } }, other: true }));
    const storage = createNodeFileStorage({ filePath });

    await storage.set("vault", [{ data: { id: "x" }, version: 1 }]);

    expect(readJson(filePath)).toEqual({
      data: { settings: { a: 1 }, vault: [{ data: { id: "x" }, version: 1 }] },
      other: true,
    });
  });

  it("applies concurrent writes in call order", async () => {
    const filePath = nextFilePath();
    const storage = createNodeFileStorage({ filePath });

    await Promise.all([storage.set("a", 1), storage.set("b", 2), storage.set("a", 3)]);

    expect(readJson(filePath)).toEqual({ data: { a: 3, b: 2 } });
  });

  it("writes compact JSON, as the desktop app does", async () => {
    const filePath = nextFilePath();
    const storage = createNodeFileStorage({ filePath });

    await storage.set("history", { lastSeenOperationDate: null });

    expect(readFileSync(filePath, "utf-8")).toBe(
      '{"data":{"history":{"lastSeenOperationDate":null}}}',
    );
  });

  it("rejects a file that is not valid JSON", async () => {
    const filePath = nextFilePath();
    writeFileSync(filePath, "{not json");
    const storage = createNodeFileStorage({ filePath });

    await expect(storage.get("vault")).rejects.toThrow(SyntaxError);
  });

  it.each([
    ["a number", "42"],
    ["a list", "[]"],
    ["null", "null"],
    ["a data list", '{"data":["recoverable"]}'],
    ["a data string", '{"data":"recoverable"}'],
  ])("rejects a file that holds %s, and never writes it", async (_label, content) => {
    const filePath = nextFilePath();
    writeFileSync(filePath, content);
    const storage = createNodeFileStorage({ filePath });

    await expect(storage.get("vault")).rejects.toThrow(TypeError);
    await expect(storage.set("vault", [])).rejects.toThrow(TypeError);
    expect(readFileSync(filePath, "utf-8")).toBe(content);
  });

  it("reads a file with no data as empty", async () => {
    const filePath = nextFilePath();
    writeFileSync(filePath, JSON.stringify({ other: true }));
    const storage = createNodeFileStorage({ filePath });

    await expect(storage.get("vault")).resolves.toBeUndefined();
  });

  it("throws StorageLockedError for an encrypted key that holds a string", async () => {
    const filePath = nextFilePath();
    writeFileSync(filePath, JSON.stringify({ data: { vault: "ciphertext" } }));
    const storage = createNodeFileStorage({ filePath, encryptedKeys: ["vault"] });

    await expect(storage.get("vault")).rejects.toEqual(new StorageLockedError("vault"));
  });

  it("refuses to write an encrypted key that holds ciphertext", async () => {
    const filePath = nextFilePath();
    writeFileSync(filePath, JSON.stringify({ data: { vault: "ciphertext" } }));
    const storage = createNodeFileStorage({ filePath, encryptedKeys: ["vault"] });

    await expect(storage.set("vault", [])).rejects.toEqual(new StorageLockedError("vault"));
    expect(readJson(filePath)).toEqual({ data: { vault: "ciphertext" } });
  });
});

describe("setMany", () => {
  it("writes every key, and keeps the other keys and the other top-level fields", async () => {
    const filePath = nextFilePath();
    writeFileSync(filePath, JSON.stringify({ data: { settings: { a: 1 } }, other: true }));
    const storage = createNodeFileStorage({ filePath });

    await storage.setMany({ vault: [{ id: "x" }], cryptoAssets: { tokens: [] } });

    expect(readJson(filePath)).toEqual({
      data: { settings: { a: 1 }, vault: [{ id: "x" }], cryptoAssets: { tokens: [] } },
      other: true,
    });
  });

  it("writes none of the keys when one of them holds ciphertext", async () => {
    const filePath = nextFilePath();
    const content = JSON.stringify({ data: { vault: "ciphertext" } });
    writeFileSync(filePath, content);
    const storage = createNodeFileStorage({ filePath, encryptedKeys: ["vault"] });

    await expect(storage.setMany({ cryptoAssets: { tokens: [] }, vault: [] })).rejects.toEqual(
      new StorageLockedError("vault"),
    );
    expect(readFileSync(filePath, "utf-8")).toBe(content);
  });

  it("writes none of the keys to a file of another shape", async () => {
    const filePath = nextFilePath();
    writeFileSync(filePath, "[]");
    const storage = createNodeFileStorage({ filePath });

    await expect(storage.setMany({ vault: [], cryptoAssets: {} })).rejects.toThrow(TypeError);
    expect(readFileSync(filePath, "utf-8")).toBe("[]");
  });

  it("goes in call order with set", async () => {
    const filePath = nextFilePath();
    const storage = createNodeFileStorage({ filePath });

    await Promise.all([
      storage.set("a", 1),
      storage.setMany({ a: 2, b: 2 }),
      storage.set("b", 3),
      storage.setMany({ c: 4 }),
    ]);

    expect(readJson(filePath)).toEqual({ data: { a: 2, b: 3, c: 4 } });
  });

  it("throws a RangeError for an empty key, as set does", () => {
    const storage = createNodeFileStorage({ filePath: nextFilePath() });

    expect(() => storage.setMany({ vault: [], "": 1 })).toThrow(RangeError);
  });
});

describeWithFileModes("the file mode", () => {
  it.each([
    ["0600", 0o600],
    ["0640", 0o640],
  ])("stays %s when a write replaces the file", async (_label, mode) => {
    const filePath = nextFilePath();
    writeFileSync(filePath, JSON.stringify({ data: {} }));
    chmodSync(filePath, mode);

    await createNodeFileStorage({ filePath }).set("vault", []);

    expect(modeOf(filePath)).toBe(mode);
  });

  it("is 0600 for a new file: only its user can read the data", async () => {
    const filePath = nextFilePath();

    await createNodeFileStorage({ filePath }).set("vault", []);

    expect(modeOf(filePath)).toBe(0o600);
  });

  it("stays 0640 when setMany replaces the file", async () => {
    const filePath = nextFilePath();
    writeFileSync(filePath, JSON.stringify({ data: {} }));
    chmodSync(filePath, 0o640);

    await createNodeFileStorage({ filePath }).setMany({ vault: [], cryptoAssets: {} });

    expect(modeOf(filePath)).toBe(0o640);
  });
});
