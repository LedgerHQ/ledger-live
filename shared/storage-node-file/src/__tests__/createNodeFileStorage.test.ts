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
    JSON.stringify({ data: { accounts: "ciphertext", history: { lastSeenOperationDate: null } } }),
  );
  return {
    storage: createNodeFileStorage({ filePath, encryptedKeys: ["accounts"] }),
    encryptedKey: "accounts",
    plainKey: "history",
  };
});

describe("createNodeFileStorage", () => {
  it("returns undefined when the file is missing", async () => {
    const storage = createNodeFileStorage({ filePath: nextFilePath() });
    await expect(storage.get("accounts")).resolves.toBeUndefined();
  });

  it("creates the file under data on the first write", async () => {
    const filePath = nextFilePath();
    const storage = createNodeFileStorage({ filePath });

    await storage.set("accounts", []);

    expect(readJson(filePath)).toEqual({ data: { accounts: [] } });
  });

  it("keeps the other keys and the other top-level fields of the file", async () => {
    const filePath = nextFilePath();
    writeFileSync(filePath, JSON.stringify({ data: { settings: { a: 1 } }, other: true }));
    const storage = createNodeFileStorage({ filePath });

    await storage.set("accounts", [{ data: { id: "x" }, version: 1 }]);

    expect(readJson(filePath)).toEqual({
      data: { settings: { a: 1 }, accounts: [{ data: { id: "x" }, version: 1 }] },
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

    await expect(storage.get("accounts")).rejects.toThrow(SyntaxError);
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

    await expect(storage.get("accounts")).rejects.toThrow(TypeError);
    await expect(storage.set("accounts", [])).rejects.toThrow(TypeError);
    expect(readFileSync(filePath, "utf-8")).toBe(content);
  });

  it("reads a file with no data as empty", async () => {
    const filePath = nextFilePath();
    writeFileSync(filePath, JSON.stringify({ other: true }));
    const storage = createNodeFileStorage({ filePath });

    await expect(storage.get("accounts")).resolves.toBeUndefined();
  });

  it("throws StorageLockedError for an encrypted key that holds a string", async () => {
    const filePath = nextFilePath();
    writeFileSync(filePath, JSON.stringify({ data: { accounts: "ciphertext" } }));
    const storage = createNodeFileStorage({ filePath, encryptedKeys: ["accounts"] });

    await expect(storage.get("accounts")).rejects.toEqual(new StorageLockedError("accounts"));
  });

  it("refuses to write an encrypted key that holds ciphertext", async () => {
    const filePath = nextFilePath();
    writeFileSync(filePath, JSON.stringify({ data: { accounts: "ciphertext" } }));
    const storage = createNodeFileStorage({ filePath, encryptedKeys: ["accounts"] });

    await expect(storage.set("accounts", [])).rejects.toEqual(new StorageLockedError("accounts"));
    expect(readJson(filePath)).toEqual({ data: { accounts: "ciphertext" } });
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

    await createNodeFileStorage({ filePath }).set("accounts", []);

    expect(modeOf(filePath)).toBe(mode);
  });

  it("is 0600 for a new file: only its user can read the accounts", async () => {
    const filePath = nextFilePath();

    await createNodeFileStorage({ filePath }).set("accounts", []);

    expect(modeOf(filePath)).toBe(0o600);
  });
});
