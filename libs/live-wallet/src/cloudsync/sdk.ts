import { MemberCredentials, Trustchain, TrustchainSDK } from "@ledgerhq/trustchain/types";
import { TrustchainOutdated } from "@ledgerhq/trustchain/errors";
import getApi, { JWT } from "./api";
import { Observable } from "rxjs";
import { z, ZodType } from "zod";
import { Cipher, makeCipher } from "./cipher";

export type UpdateEvent<Data> =
  | {
      type: "new-data";
      data: Data;
      version: number;
    }
  | {
      type: "pushed-data";
      data: Data;
      version: number;
    }
  | {
      type: "deleted-data";
    };

export class CloudSyncSDK<Schema extends ZodType, Data = z.infer<Schema>> {
  private slug: string;
  private schema: Schema;
  private trustchainSdk: TrustchainSDK;
  private getCurrentVersion: () => number | undefined;
  private saveNewUpdate: (updateEvent: UpdateEvent<Data>) => Promise<void>;
  private cipher: Cipher<Data>;
  private api: ReturnType<typeof getApi>;

  constructor({
    apiBaseUrl,
    slug,
    schema,
    trustchainSdk,
    getCurrentVersion,
    saveNewUpdate,
  }: {
    /**
     * base URL of the cloud sync API
     */
    apiBaseUrl: string;
    /**
     * slug used with cloud sync API ((example "live")
     */
    slug: string;
    /**
     * schema that parse the data stored on cloud sync
     */
    schema: Schema;
    /**
     * an instance of Trustchain SDK
     */
    trustchainSdk: TrustchainSDK;
    /**
     * returns the current version of the data, if available.
     */
    getCurrentVersion: () => number | undefined;
    /**
     * apply the data over the accounts and we also save the version.
     * All the reconciliation and async save can be performed at this step in order to guarantee atomicity of the operations.
     */
    saveNewUpdate: (event: UpdateEvent<Data>) => Promise<void>;
  }) {
    this.slug = slug;
    this.schema = schema;
    this.trustchainSdk = trustchainSdk;
    this.getCurrentVersion = getCurrentVersion;
    this.saveNewUpdate = saveNewUpdate;
    this.cipher = makeCipher(trustchainSdk);
    this.push = this.decorateMethod("push", this.push);
    this.pull = this.decorateMethod("pull", this.pull);
    this.destroy = this.decorateMethod("destroy", this.destroy);
    this.api = getApi(apiBaseUrl);
  }

  /**
   * Push new data to the Cloud Sync backend.
   * Will fails if the version is out of sync. (conflicts)
   */
  async push(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    data: Data,
  ): Promise<void> {
    this.schema.parse(data); // validate against the schema, throws if it doesn't parse
    const validated = data; // IMPORTANT: we intentionally don't take validated out of parse() because we need to keep the possible extra field that we don't handle yet and that need to be preserved on the distant data
    const base64 = await this.cipher.encrypt(trustchain, validated);
    const version = (this.getCurrentVersion() || 0) + 1;
    const response = await this.trustchainSdk.withAuth(trustchain, memberCredentials, jwt =>
      this.api.uploadData(jwt, this.slug, version, base64, trustchain),
    );
    switch (response.status) {
      case "updated": {
        await this.saveNewUpdate({ type: "pushed-data", version, data });
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
      this.api.fetchData(jwt, this.slug, this.getCurrentVersion(), trustchain),
    );
    switch (response.status) {
      case "no-data": {
        const version = this.getCurrentVersion();
        if (version) {
          // server have no data anymore, we need to delete our local data and inform upstream that the trustchain may be outdated.
          await this.saveNewUpdate({ type: "deleted-data" });
          throw new TrustchainOutdated();
        }
        break;
      }
      case "up-to-date": {
        // already up to date
        break;
      }
      case "out-of-sync": {
        const json = await this.cipher.decrypt(trustchain, response.payload);
        this.schema.parse(json); // validate against the schema, throws if it doesn't parse
        const validated = json; // IMPORTANT: we intentionally don't take validated out of parse() because we need to keep the possible extra field that we don't handle yet and that need to be preserved on the distant data
        const version = response.version;
        await this.saveNewUpdate({ type: "new-data", data: validated, version });
        break;
      }
    }
  }

  async destroy(trustchain: Trustchain, memberCredentials: MemberCredentials): Promise<void> {
    await this.trustchainSdk.withAuth(trustchain, memberCredentials, jwt =>
      this.api.deleteData(jwt, this.slug, trustchain),
    );
    await this.saveNewUpdate({ type: "deleted-data" });
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
    return this.api.listenNotifications(getFreshJwt, this.slug);
  }

  private lock: string | null = null;
  // this helpers will guarantee only one poll()/push() is performed at a time.
  private decorateMethod<R, A extends unknown[]>(
    methodName: string,
    f: (...args: A) => Promise<R>,
  ): (...args: A) => Promise<R> {
    return async (...args) => {
      const { lock } = this;
      if (lock) {
        return Promise.reject(new Error("CloudSyncSDK locked (" + this.lock + ")"));
      }
      try {
        this.lock = methodName;
        return await f.apply(this, args);
      } finally {
        this.lock = null;
      }
    };
  }
}
