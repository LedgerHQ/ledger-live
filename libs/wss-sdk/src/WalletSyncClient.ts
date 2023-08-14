import crypto from "crypto";
import { schemaAtomicGetResponse, schemaAtomicPostResponse } from "./types/api/index";
import { Observable, Subject } from "rxjs";
import axios, { Axios } from "axios";
import { AccountMetadata } from "./dataTypes/Account/1.0.0/types";
import { IV_LENGTH } from "./constants";
import { schemaWalletDecryptedData } from "./dataTypes/schemas";
import { WalletDecryptedData } from "./dataTypes/types";
import { getUserIdForPrivateKey } from "./helpers";

type SaveDataParams = AccountMetadata[];

type WalletSyncVersionManager = {
  onVersionUpdate: (version: number) => void;
  getVersion: () => number | undefined;
};

type WalletSyncClientParams = {
  pollFrequencyMs: number;
  url: string;
  auth: string;
  clientInfo: string; // lld/1.0.0
};

export class WalletSyncClient {
  private _versionManager: WalletSyncVersionManager;

  private _intervalHandle: NodeJS.Timer | null = null;

  private _params: WalletSyncClientParams;

  private _subject: Subject<[WalletDecryptedData, number]> = new Subject();

  private _axios: Axios;

  private _userId: string;

  private _auth: Buffer;

  constructor(params: WalletSyncClientParams, versionManager: WalletSyncVersionManager) {
    this._auth = Buffer.from(params.auth, "hex");
    this._params = params;
    this._versionManager = versionManager;
    this._userId = getUserIdForPrivateKey(this._auth);

    // FIXME quick hack. we will need to implement this properly. just to get a unique user
    const publicKey = `aaaaaa000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000${this._userId.slice(
      this._userId.length - 8,
    )}`;

    this._axios = axios.create({
      baseURL: params.url,
      headers: {
        "X-Ledger-Public-Key": publicKey,
        "X-Ledger-Client-Version": params.clientInfo,
      },
    });
  }

  /**
   * allows consumer to get incoming updates
   * the data with the version associated to it is attached and
   * it is the userland responsability to do the onVersionUpdate associated to it once the data is entirely handled.
   */
  observable(): Observable<[WalletDecryptedData, number]> {
    return this._subject;
  }

  private async _poll() {
    const version = this._versionManager.getVersion();

    const rawResponse = await this._axios.get<unknown>(`/atomic/v1/accounts`, {
      params: { version },
      headers: {
        // TODO set these fields properly in the future
        "X-Ledger-Timestamp": "2000-01-01T00:00:00.000000000+00:00",
        "X-Ledger-Signature": "0000000000000000000000000000000000000000000000000000000000000000",
      },
    });

    const response = schemaAtomicGetResponse.parse(rawResponse.data);

    // eslint-disable-next-line default-case
    switch (response.status) {
      case "no-data": {
        break;
      }
      case "up-to-date": {
        break;
      }
      case "out-of-sync": {
        const rawPayload = Buffer.from(response.payload, "base64");
        const iv = rawPayload.slice(0, IV_LENGTH);
        const encryptedData = rawPayload.slice(IV_LENGTH);

        const decipher = crypto.createDecipheriv("aes-256-cbc", this._auth, iv);

        const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

        const parsedData: unknown = JSON.parse(decryptedData.toString());

        const safeData = schemaWalletDecryptedData.parse(parsedData);

        this._subject.next([safeData, response.version]);
        break;
      }
    }
  }

  async saveData(data: SaveDataParams) {
    const version = this._versionManager.getVersion();

    const serializedData = Buffer.from(JSON.stringify(data), "utf8");

    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv("aes-256-cbc", this._auth, iv);
    const encryptedData = Buffer.concat([cipher.update(serializedData), cipher.final()]);

    const rawPayload = Buffer.concat([iv, encryptedData]);

    const newVersion = (version ?? 0) + 1;

    const rawResponse = await this._axios.post<unknown>(
      `/atomic/v1/accounts`,
      {
        payload: rawPayload.toString("base64"),
      },
      {
        params: {
          version: newVersion,
        },
        headers: {
          "X-Ledger-Timestamp": "2000-01-01T00:00:00.000000000+00:00",
          "X-Ledger-Signature": "0000000000000000000000000000000000000000000000000000000000000000",
        },
      },
    );

    const response = schemaAtomicPostResponse.parse(rawResponse.data);

    // FIXME code was commented because: why doing this here? shouldn't we receive it on the observable() side anyway?
    // I think doing this here introduce race conditions due to fact the http POST was async
    /*
    if (response.status === "updated") {
      this._versionManager.onVersionUpdate(response.version);
    }
    */

    return response;
  }

  start() {
    if (this._intervalHandle !== null) {
      throw new Error("WalletSyncClient already started");
    }

    // starting the update loop
    this._intervalHandle = setInterval(() => {
      void this._poll();
    }, this._params.pollFrequencyMs);

    // doing an initial poll
    void this._poll();
  }

  stop() {
    if (this._intervalHandle === null) {
      throw new Error("WalletSyncClient not started");
    }

    // stopping the update loop
    clearInterval(this._intervalHandle);
    this._intervalHandle = null;
  }

  isStarted(): boolean {
    return this._intervalHandle !== null;
  }
}
