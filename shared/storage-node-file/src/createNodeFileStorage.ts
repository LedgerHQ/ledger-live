import { chmod, readFile, rename, stat, writeFile } from "node:fs/promises";
import { StorageLockedError, type StoragePort } from "@shared/storage";
import { isAppJsonFile, isMissingFileError, type AppJsonFile } from "./internals";

type NodeFileStorageInput = {
  filePath: string;
  encryptedKeys?: ReadonlyArray<string>;
};

const assertKey = (key: string) => {
  if (key.length === 0) throw new RangeError("A storage key must not be empty");
};

async function readContent(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, "utf-8");
  } catch (error) {
    if (isMissingFileError(error)) return undefined;
    throw error;
  }
}

/** A file of another shape throws: read as empty, the next write would replace its data. */
async function readAppJson(filePath: string): Promise<AppJsonFile | undefined> {
  const content = await readContent(filePath);
  if (content === undefined) return undefined;
  const parsed: unknown = JSON.parse(content);
  if (!isAppJsonFile(parsed)) throw new TypeError("The file is not an object with a data object");
  return parsed;
}

/** The file can hold private user data: a new file is for its user only. */
const NEW_FILE_MODE = 0o600;

async function modeOf(filePath: string): Promise<number> {
  try {
    return (await stat(filePath)).mode & 0o777;
  } catch (error) {
    if (isMissingFileError(error)) return NEW_FILE_MODE;
    throw error;
  }
}

/** The rename replaces the file, so the temporary file must have the mode of the file. */
async function writeAppJson(filePath: string, file: AppJsonFile): Promise<void> {
  const temporaryPath = `${filePath}.tmp`;
  const mode = await modeOf(filePath);
  await writeFile(temporaryPath, JSON.stringify(file), { encoding: "utf-8", mode });
  // The umask applies to the mode of a new file, and an old temporary file keeps its mode.
  await chmod(temporaryPath, mode);
  await rename(temporaryPath, filePath);
}

export function createNodeFileStorage({
  filePath,
  encryptedKeys = [],
}: NodeFileStorageInput): StoragePort {
  const encrypted = new Set(encryptedKeys);
  let queue: Promise<unknown> = Promise.resolve();

  const inOrder = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = queue.then(operation);
    queue = result.catch(() => undefined);
    return result;
  };

  return {
    get(key) {
      assertKey(key);
      return inOrder(async () => {
        const file = await readAppJson(filePath);
        const value = file?.data?.[key];
        const isStillEncrypted = encrypted.has(key) && typeof value === "string";
        if (isStillEncrypted) throw new StorageLockedError(key);
        return value;
      });
    },
    set(key, value) {
      assertKey(key);
      return inOrder(async () => {
        const file = (await readAppJson(filePath)) ?? { data: {} };
        // A tool cannot encrypt: it must never replace the ciphertext of an encrypted key.
        const isStillEncrypted = encrypted.has(key) && typeof file.data?.[key] === "string";
        if (isStillEncrypted) throw new StorageLockedError(key);
        await writeAppJson(filePath, { ...file, data: { ...file.data, [key]: value } });
      });
    },
  };
}
