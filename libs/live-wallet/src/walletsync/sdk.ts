import { Trustchain, TrustchainSDK } from "@ledgerhq/trustchain/types";
import { Data, schema } from "./datatypes/accounts";
import api, { JWT } from "./api";
import Base64 from "base64-js";
import { compress, decompress } from "fflate";

export type UpdateEvent =
  | {
      type: "new-data";
      data: Data;
      version: number;
    }
  | {
      type: "pushed-data";
      version: number;
    }
  | {
      type: "deleted-data";
    };

export class WalletSyncSDK {
  trustchainSdk: TrustchainSDK;
  getCurrentVersion: () => number | undefined;
  saveNewUpdate: (updateEvent: UpdateEvent) => Promise<void>;

  constructor({
    trustchainSdk,
    getCurrentVersion,
    saveNewUpdate,
  }: {
    trustchainSdk: TrustchainSDK;
    /**
     * returns the current version of the data, if available.
     */
    getCurrentVersion: () => number | undefined;
    /**
     * apply the data over the accounts and we also save the version.
     */
    saveNewUpdate: (event: UpdateEvent) => Promise<void>;
  }) {
    this.trustchainSdk = trustchainSdk;
    this.getCurrentVersion = getCurrentVersion;
    this.saveNewUpdate = saveNewUpdate;
  }

  async push(jwt: JWT, trustchain: Trustchain, data: Data): Promise<void> {
    const validated = schema.parse(data);
    const json = JSON.stringify(validated);
    const bytes = new TextEncoder().encode(json);
    const compressed = await new Promise<Uint8Array>((resolve, reject) =>
      compress(bytes, (err, result) => (err ? reject(err) : resolve(result))),
    );
    const encrypted = await this.trustchainSdk.encryptUserData(trustchain, compressed);
    const base64 = Base64.fromByteArray(encrypted);
    const version = (this.getCurrentVersion() || 0) + 1;
    const response = await api.uploadData(jwt, "accounts", version, base64);
    switch (response.status) {
      case "updated": {
        await this.saveNewUpdate({
          type: "pushed-data",
          version,
        });
        break;
      }
      case "out-of-sync": {
        // WHAT TO DO? maybe we ignore because in this case we just wait for a pull?
        console.warn("out-of-sync", response);
      }
    }
  }

  async pull(jwt: JWT, trustchain: Trustchain): Promise<void> {
    const response = await api.fetchDataStatus(jwt, "accounts", this.getCurrentVersion());
    switch (response.status) {
      case "no-data": {
        // no data, nothing to do
        break;
      }
      case "up-to-date": {
        // already up to date
        break;
      }
      case "out-of-sync": {
        const decrypted = await this.trustchainSdk
          .decryptUserData(trustchain, Base64.toByteArray(response.payload))
          .catch(e => {
            // TODO if we fail to decrypt, it may mean we need to restore trustchain. and if it still fails and on specific error, we will have to eject. figure out how to integrate this in the pull lifecycle.
            throw e;
          });
        const decompressed = await new Promise<Uint8Array>((resolve, reject) =>
          decompress(decrypted, (err, result) => (err ? reject(err) : resolve(result))),
        );
        const json = JSON.parse(new TextDecoder().decode(decompressed));
        const validated = schema.parse(json);
        const version = response.version;
        await this.saveNewUpdate({
          type: "new-data",
          data: validated,
          version,
        });
        break;
      }
    }
  }

  async destroy(jwt: JWT): Promise<void> {
    await api.deleteData(jwt, "accounts");
    await this.saveNewUpdate({
      type: "deleted-data",
    });
  }
}
