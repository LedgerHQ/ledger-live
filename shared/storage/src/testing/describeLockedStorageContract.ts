import { StorageLockedError } from "../errors";
import type { StoragePort } from "../StoragePort";

type LockedStorageSetup = {
  storage: StoragePort;
  encryptedKey: string;
  plainKey: string;
};

export function describeLockedStorageContract(
  name: string,
  createLockedAdapter: () => LockedStorageSetup,
): void {
  describe(`${name} locked storage contract`, () => {
    it("rejects the read of an encrypted key with StorageLockedError", async () => {
      const { storage, encryptedKey } = createLockedAdapter();
      await expect(storage.get(encryptedKey)).rejects.toThrow(StorageLockedError);
    });

    it("keeps the encrypted value out of the error", async () => {
      const { storage, encryptedKey } = createLockedAdapter();
      const rejection = await storage.get(encryptedKey).catch((error: unknown) => error);
      expect(rejection).toEqual(expect.objectContaining({ key: encryptedKey }));
      expect(String(rejection)).not.toMatch(/ciphertext/);
    });

    it("reads a plain key as usual", async () => {
      const { storage, plainKey } = createLockedAdapter();
      await expect(storage.get(plainKey)).resolves.not.toBeInstanceOf(StorageLockedError);
    });
  });
}
