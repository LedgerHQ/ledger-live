import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { CryptoAssetsStore } from "@ledgerhq/types-live";
import { CryptoAssetsApi } from "./api";

/**
 * Simple adapter that implements CryptoAssetsStore interface using RTK Query API directly.
 * The persistent caching is handled internally by the API's custom baseQuery.
 */
export class RtkCryptoAssetsStore implements CryptoAssetsStore {
  private api: CryptoAssetsApi;
  private dispatch: <T>(action: T) => Promise<any>;

  constructor(api: CryptoAssetsApi, dispatch: <T>(action: T) => Promise<any>) {
    this.api = api;
    this.dispatch = dispatch;
  }

  async findTokenById(id: string): Promise<TokenCurrency | undefined> {
    const result = await this.dispatch(this.api.endpoints.findTokenById.initiate({ id }));

    if (result.error) throw result.error;
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

    if (result.error) throw result.error;
    return result.data;
  }

  async getTokensSyncHash(currencyId: string): Promise<string> {
    const result = await this.dispatch(this.api.endpoints.getTokensSyncHash.initiate(currencyId));
    if (result.error) throw result.error;
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
