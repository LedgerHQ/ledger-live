import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { CryptoAssetsStore } from "@ledgerhq/types-live";
import { CryptoAssetsApi } from "./api";
import { NetworkDown, LedgerAPI4xx, LedgerAPI5xx } from "@ledgerhq/errors";

/**
 * Simple adapter that implements CryptoAssetsStore interface using RTK Query API directly.
 * The persistent caching is handled internally by the API's custom baseQuery.
 */
export class RtkCryptoAssetsStore implements CryptoAssetsStore {
  private readonly api: CryptoAssetsApi;
  private readonly dispatch: <T>(action: T) => Promise<any>;

  constructor(api: CryptoAssetsApi, dispatch: <T>(action: T) => Promise<any>) {
    this.api = api;
    this.dispatch = dispatch;
  }

  async findTokenById(id: string): Promise<TokenCurrency | undefined> {
    const result = await this.dispatch(this.api.endpoints.findTokenById.initiate({ id }));
    if (result.error) throw remapRtkQueryError(result.error);
    return result.data;
  }

  async findTokenByAddressInCurrency(
    address: string,
    currencyId: string,
  ): Promise<TokenCurrency | undefined> {
    const result = await this.dispatch(
      this.api.endpoints.findTokenByAddressInCurrency.initiate({
        contract_address: address,
        network: currencyId,
      }),
    );
    if (result.error) throw remapRtkQueryError(result.error);
    return result.data;
  }

  async getTokensSyncHash(currencyId: string): Promise<string> {
    const result = await this.dispatch(this.api.endpoints.getTokensSyncHash.initiate(currencyId));
    if (result.error) throw remapRtkQueryError(result.error);
    return result.data;
  }

  getApi(): CryptoAssetsApi {
    return this.api;
  }
}

export function createRtkCryptoAssetsStore(
  api: CryptoAssetsApi,
  dispatch: <T>(action: T) => Promise<any>,
): RtkCryptoAssetsStore {
  return new RtkCryptoAssetsStore(api, dispatch);
}

function remapRtkQueryError(error: { status: string | number; error: string }): Error {
  // see https://github.com/reduxjs/redux-toolkit/blob/39e7c8fb97e4e1da513d52925eda2898eb17426e/packages/toolkit/etc/rtk-query.api.md?plain=1#L208
  if (typeof error.status === "number") {
    const status = error.status;
    if (status >= 400 && status < 500) {
      return new LedgerAPI4xx();
    } else if (status >= 500 && status < 600) {
      return new LedgerAPI5xx();
    }
    return new NetworkDown();
  } else if (error.status === "FETCH_ERROR") {
    return new NetworkDown();
  }
  return new Error(error.error);
}
