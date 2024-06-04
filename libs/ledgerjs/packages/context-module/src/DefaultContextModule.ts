import { ContextModule } from "./ContextModule";
import { HttpExternalPluginDataSource } from "./external-plugin/data/HttpExternalPluginDataSource";
import { ExternalPluginContextLoader } from "./external-plugin/domain/ExternalPluginContextLoader";
import { HttpForwardDomainDataSource } from "./forward-domain/data/HttpForwardDomainDataSource";
import { ForwardDomainContextLoader } from "./forward-domain/domain/ForwardDomainContextLoader";
import { HttpTokenDataSource } from "./token/data/HttpTokenDataSource";
import { TokenContextLoader } from "./token/domain/TokenContextLoader";
import { HttpNftDataSource } from "./nft/data/HttpNftDataSource";
import { NftContextLoader } from "./nft/domain/NftContextLoader";
import { ContextResponse } from "./shared/model/ContextResponse";
import { ContextLoader } from "./shared/domain/ContextLoader";
import { LoaderOptions } from "./shared/model/LoaderOptions";
import { Transaction } from "./shared/model/Transaction";

type DefaultContextModuleConstructorArgs =
  | {
      loaders?: ContextLoader[];
    }
  | undefined;

export const defaultLedgerLoaders: ContextLoader[] = [
  new TokenContextLoader(new HttpTokenDataSource()),
  new NftContextLoader(new HttpNftDataSource()),
  new ForwardDomainContextLoader(new HttpForwardDomainDataSource()),
  new ExternalPluginContextLoader(new HttpExternalPluginDataSource(), new HttpTokenDataSource()),
];

export class DefaultContextModule implements ContextModule {
  private _loaders: ContextLoader[];

  constructor({ loaders = defaultLedgerLoaders }: DefaultContextModuleConstructorArgs = {}) {
    this._loaders = loaders;
  }

  public async getContexts(
    transaction: Transaction,
    options: LoaderOptions,
  ): Promise<ContextResponse[]> {
    const promises = this._loaders.map(fetcher => fetcher.load(transaction, options));
    const responses = await Promise.all(promises);
    return responses.flat();
  }
}
