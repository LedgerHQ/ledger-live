import { MemberCredentials, Trustchain, TrustchainSDK } from "@ledgerhq/trustchain/types";
import { LiveData, liveSchema, liveSlug } from "./datatypes/live";
import api, { JWT } from "./api";
import Base64 from "base64-js";
import { compress, decompress } from "fflate";
import { Observable } from "rxjs";

export type UpdateEvent =
  | {
      type: "new-data";
      data: LiveData;
      version: number;
    }
  | {
      type: "pushed-data";
      version: number;
    }
  | {
      type: "deleted-data";
    };

export class CloudSyncSDK {
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
     * All the reconciliation and async save can be performed at this step in order to guarantee atomicity of the operations.
     */
    saveNewUpdate: (event: UpdateEvent) => Promise<void>;
  }) {
    this.trustchainSdk = trustchainSdk;
    this.getCurrentVersion = getCurrentVersion;
    this.saveNewUpdate = saveNewUpdate;

    this.push = this._decorateMethod("push", this.push);
    this.pull = this._decorateMethod("pull", this.pull);
    this.destroy = this._decorateMethod("destroy", this.destroy);
  }

  /**
   * Push new data to the Cloud Sync backend.
   * Will fails if the version is out of sync. (conflicts)
   */
  async push(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    data: LiveData,
  ): Promise<void> {
    const validated = liveSchema.parse(data);
    const json = JSON.stringify(validated);
    const bytes = new TextEncoder().encode(json);
    const compressed = await new Promise<Uint8Array>((resolve, reject) =>
      compress(bytes, (err, result) => (err ? reject(err) : resolve(result))),
    );
    const encrypted = await this.trustchainSdk.encryptUserData(trustchain, compressed);
    const base64 = Base64.fromByteArray(encrypted);
    const version = (this.getCurrentVersion() || 0) + 1;
    const response = await this.trustchainSdk.withAuth(trustchain, memberCredentials, jwt =>
      api.uploadData(jwt, liveSlug, version, base64),
    );
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

  /**
   * Pull new data from the Cloud Sync backend, if any.
   * If new data is retrieved, it will be decrypted and saveNewUpdate will be called as part of this atomic process.
   */
  async pull(trustchain: Trustchain, memberCredentials: MemberCredentials): Promise<void> {
    const response = await this.trustchainSdk.withAuth(trustchain, memberCredentials, jwt =>
      api.fetchData(jwt, liveSlug, this.getCurrentVersion()),
    );
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
            // or do we "let it fail" and handle it more globally on app side? TBD
            throw e;
          });
        const decompressed = await new Promise<Uint8Array>((resolve, reject) =>
          decompress(decrypted, (err, result) => (err ? reject(err) : resolve(result))),
        );
        const json = JSON.parse(new TextDecoder().decode(decompressed));
        const validated = liveSchema.parse(json);
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

  async destroy(trustchain: Trustchain, memberCredentials: MemberCredentials): Promise<void> {
    await this.trustchainSdk.withAuth(trustchain, memberCredentials, jwt =>
      api.deleteData(jwt, liveSlug),
    );
    await this.saveNewUpdate({
      type: "deleted-data",
    });
  }

  _lock: string | null = null;
  // this helpers will guarantee only one poll()/push() is performed at a time.
  _decorateMethod<R, A extends unknown[]>(
    methodName: string,
    f: (...args: A) => Promise<R>,
  ): (...args: A) => Promise<R> {
    return async (...args) => {
      const { _lock } = this;

      if (_lock) {
        return Promise.reject(new Error("CloudSyncSDK locked (" + this._lock + ")"));
      }

      try {
        this._lock = methodName;
        return await f.apply(this, args);
      } finally {
        this._lock = null;
      }
    };
  }

  /**
   * This returns an observable that will emit versions in real time.
   * The current version is emitted once at first and then any update will be emitted.
   * It is your responsability to then hook this to pull() when you want to refresh the data and make sure you do it in sequence, once at a time (you must prevent race conditions)
   */
  listenNotifications(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Observable<number> {
    const getFreshJwt = (): Promise<JWT> =>
      this.trustchainSdk.withAuth(
        trustchain,
        memberCredentials,
        jwt => Promise.resolve(jwt),
        "refresh",
      );
    return api.listenNotifications(getFreshJwt, liveSlug);
  }
}
