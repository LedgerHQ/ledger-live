import { ContextModule } from "./ContextModule";
import { ContextLoader } from "./shared/domain/ContextLoader";
import { ContextResponse } from "./shared/model/ContextResponse";
import { LoaderOptions } from "./shared/model/LoaderOptions";
import { Transaction } from "./shared/model/Transaction";

type DefaultContextModuleConstructorArgs = {
  loaders: ContextLoader[];
};

export class DefaultContextModule implements ContextModule {
  private _loaders: ContextLoader[];

  constructor(args: DefaultContextModuleConstructorArgs) {
    this._loaders = args.loaders;
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
