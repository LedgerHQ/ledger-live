import { ContextModule } from "./ContextModule";
import { HttpExternalPluginDataSource } from "./external-plugin/data/HttpExternalPluginDataSource";
import { ExternalPluginContextLoader } from "./external-plugin/domain/ExternalPluginContextLoader";
import { HttpForwardDomainDataSource } from "./forward-domain/data/HttpForwardDomainDataSource";
import { ForwardDomainContextLoader } from "./forward-domain/domain/ForwardDomainContextLoader";
import { HttpNftDataSource } from "./nft/data/HttpNftDataSource";
import { NftContextLoader } from "./nft/domain/NftContextLoader";
import { ContextLoader } from "./shared/domain/ContextLoader";
import { ContextResponse } from "./shared/model/ContextResponse";
import { LoaderOptions } from "./shared/model/LoaderOptions";
import { Transaction } from "./shared/model/Transaction";
import { HttpTokenDataSource } from "./token/data/HttpTokenDataSource";
import { TokenContextLoader } from "./token/domain/TokenContextLoader";

type DefaultContextModuleConstructorArgs = {
  loaders: ContextLoader[];
};

export class DefaultContextModule implements ContextModule {
  private _loaders: ContextLoader[];

  constructor(args?: DefaultContextModuleConstructorArgs) {
    const tokenDataSource = new HttpTokenDataSource();
    this._loaders = args?.loaders ?? [
      new TokenContextLoader(tokenDataSource),
      new NftContextLoader(new HttpNftDataSource()),
      new ForwardDomainContextLoader(new HttpForwardDomainDataSource()),
      new ExternalPluginContextLoader(new HttpExternalPluginDataSource(), tokenDataSource),
    ];
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
