import {
  MemberCredentials,
  Trustchain,
  TrustchainSDK,
  JWT,
  TrustchainOutdated,
} from "../trustchain-types";
import getApi from "./api";
import { Observable } from "rxjs";
import { z, ZodType } from "zod";
import { Cipher, makeCipher } from "./cipher";

export type UpdateEvent<Data> =
  | { type: "new-data"; data: Data; version: number }
  | { type: "pushed-data"; data: Data; version: number }
  | { type: "deleted-data" };

export interface CloudSyncSDKInterface<Data> {
  push(trustchain: Trustchain, memberCredentials: MemberCredentials, data: Data): Promise<void>;
  pull(trustchain: Trustchain, memberCredentials: MemberCredentials): Promise<void>;
  destroy(trustchain: Trustchain, memberCredentials: MemberCredentials): Promise<void>;
  listenNotifications(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Observable<number>;
}

export class CloudSyncSDK<
  Schema extends ZodType,
  Data = z.infer<Schema>,
> implements CloudSyncSDKInterface<Data> {
  private readonly slug: string;
  private readonly schema: Schema;
  private readonly trustchainSdk: TrustchainSDK;
  private readonly getCurrentVersion: () => number | undefined;
  private readonly saveNewUpdate: (updateEvent: UpdateEvent<Data>) => Promise<void>;
  private readonly cipher: Cipher<Data>;
  private readonly api: ReturnType<typeof getApi>;

  constructor({
    apiBaseUrl,
    slug,
    schema,
    trustchainSdk,
    getCurrentVersion,
    saveNewUpdate,
  }: {
    apiBaseUrl: string;
    slug: string;
    schema: Schema;
    trustchainSdk: TrustchainSDK;
    getCurrentVersion: () => number | undefined;
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

  async push(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    data: Data,
  ): Promise<void> {
    this.schema.parse(data);
    const validated = data;
    const base64 = await this.cipher.encrypt(trustchain, validated);
    const version = (this.getCurrentVersion() || 0) + 1;
    const response = await this.trustchainSdk.withAuth(trustchain, memberCredentials, jwt =>
      this.api.uploadData(jwt, this.slug, version, base64, trustchain),
    );
    switch (response.status) {
      case "updated":
        await this.saveNewUpdate({ type: "pushed-data", version, data });
        break;
      case "out-of-sync":
        break;
    }
  }

  async pull(trustchain: Trustchain, memberCredentials: MemberCredentials): Promise<void> {
    const response = await this.trustchainSdk.withAuth(trustchain, memberCredentials, jwt =>
      this.api.fetchData(jwt, this.slug, this.getCurrentVersion(), trustchain),
    );
    switch (response.status) {
      case "no-data": {
        const version = this.getCurrentVersion();
        if (version) {
          await this.saveNewUpdate({ type: "deleted-data" });
          throw new TrustchainOutdated();
        }
        break;
      }
      case "up-to-date":
        break;
      case "out-of-sync": {
        const json = await this.cipher.decrypt(trustchain, response.payload);
        this.schema.parse(json);
        const validated = json;
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
  private decorateMethod<R, A extends unknown[]>(
    methodName: string,
    f: (...args: A) => Promise<R>,
  ): (...args: A) => Promise<R> {
    return async (...args) => {
      const { lock } = this;
      if (lock) throw new Error("CloudSyncSDK locked (" + this.lock + ")");
      try {
        this.lock = methodName;
        return await f.apply(this, args);
      } finally {
        this.lock = null;
      }
    };
  }
}
