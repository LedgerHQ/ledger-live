import type { AxiosResponse } from "axios";
import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import { toA4HttpError } from "./errors";
import type {
  A4AccountView,
  A4BalanceView,
  A4ListOperationsParams,
  A4ListOperationsResponse,
  A4Result,
  A4Tag,
} from "./types";

const LEDGER_WALLET_TAG: A4Tag = { key: "source", value: "Ledger Wallet" };

function readVersion(headers?: AxiosResponse["headers"]): string | undefined {
  const v = headers?.["a4-account-version"];
  return typeof v === "string" ? v : undefined;
}

export class A4Client {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(baseUrl: string, network: string, timeout = 10000) {
    this.baseUrl = `${baseUrl}/${network}/v2`;
    this.timeout = timeout;
  }

  private url(...path: string[]): string {
    return [this.baseUrl, ...path].join("/");
  }

  private versionHeader(ifVersion?: string | undefined): Record<string, string> {
    return ifVersion ? { "A4-If-Account-Version": ifVersion } : {};
  }

  async getAccount(
    accountId: string,
    ifVersion?: string | undefined,
  ): Promise<A4Result<A4AccountView>> {
    const url = this.url("account", accountId);
    const headers = this.versionHeader(ifVersion);
    try {
      const { data, headers: responseHeaders } = await network<A4AccountView>({
        method: "GET",
        url,
        headers,
        timeout: this.timeout,
      });
      return { data, version: readVersion(responseHeaders) };
    } catch (err) {
      const error = toA4HttpError(err);
      log("a4 - getAccount", error.message, { url, headers });
      throw error;
    }
  }

  async createAccount(accountId: string): Promise<A4Result<string>> {
    const url = this.url("account", accountId);
    try {
      const { data, headers } = await network<string, { tags: A4Tag[] }>({
        method: "PUT",
        url,
        data: { tags: [LEDGER_WALLET_TAG] },
        timeout: this.timeout,
      });
      return { data, version: readVersion(headers) };
    } catch (err) {
      const error = toA4HttpError(err);
      log("a4 - createAccount", error.message, { url });
      throw error;
    }
  }

  async addAddresses(
    accountId: string,
    addresses: string[],
    ifVersion?: string | undefined,
  ): Promise<A4Result<string>> {
    const url = this.url("account", accountId, "addresses");
    const headers = this.versionHeader(ifVersion);
    try {
      const { data, headers: responseHeaders } = await network<string, string[]>({
        method: "PUT",
        url,
        headers,
        data: addresses,
        timeout: this.timeout,
      });
      return { data, version: readVersion(responseHeaders) ?? data };
    } catch (err) {
      const error = toA4HttpError(err);
      log("a4 - addAddresses", error.message, { url, headers });
      throw error;
    }
  }

  async getBalance(
    accountId: string,
    ifVersion?: string | undefined,
  ): Promise<A4Result<A4BalanceView>> {
    const url = this.url("account", accountId, "state", "balance");
    const headers = this.versionHeader(ifVersion);
    const params = { atBlock: "latest" };
    try {
      const { data, headers: responseHeaders } = await network<A4BalanceView>({
        method: "GET",
        url,
        headers,
        params,
        timeout: this.timeout,
      });
      return { data, version: readVersion(responseHeaders) };
    } catch (err) {
      const error = toA4HttpError(err);
      log("a4 - getBalance", error.message, { url, params, headers });
      throw error;
    }
  }

  async listOperations(
    accountId: string,
    params: A4ListOperationsParams,
    ifVersion?: string | undefined,
  ): Promise<A4Result<A4ListOperationsResponse>> {
    const url = this.url("account", accountId, "state", "operations");
    const headers = this.versionHeader(ifVersion);
    const { blocks = [0, "latest"], ...rest } = params;
    const serializedParams = { ...rest, blocks: JSON.stringify(blocks) };
    try {
      const { data, headers: responseHeaders } = await network<A4ListOperationsResponse>({
        method: "GET",
        url,
        headers,
        params: serializedParams,
        timeout: this.timeout,
      });
      return { data, version: readVersion(responseHeaders) };
    } catch (err) {
      const error = toA4HttpError(err);
      log("a4 - listOperations", error.message, { url, params: serializedParams, headers });
      throw error;
    }
  }
}
