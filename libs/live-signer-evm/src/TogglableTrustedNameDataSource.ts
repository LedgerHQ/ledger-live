import {
  DEFAULT_CONFIG,
  GetDomainNameInfosParams,
  GetTrustedNameInfosParams,
  HttpTrustedNameDataSource,
  TrustedNameDataSource,
  TrustedNamePayload,
} from "@ledgerhq/context-module";
import { Either, Left } from "purify-ts";

export class TogglableTrustedNameDataSource implements TrustedNameDataSource {
  private _defaultDataSource = new HttpTrustedNameDataSource(DEFAULT_CONFIG);
  private _enableTrustedNames = false;

  public enableTrustedNames() {
    this._enableTrustedNames = true;
  }

  public disableTrustedNames() {
    this._enableTrustedNames = false;
  }

  async getDomainNamePayload(
    params: GetDomainNameInfosParams,
  ): Promise<Either<Error, TrustedNamePayload>> {
    if (!this._enableTrustedNames) {
      return Left<Error, TrustedNamePayload>(new Error("Trusted names are not enabled"));
    }

    return this._defaultDataSource.getDomainNamePayload(params);
  }

  async getTrustedNamePayload(params: GetTrustedNameInfosParams) {
    return this._defaultDataSource.getTrustedNamePayload(params);
  }
}
