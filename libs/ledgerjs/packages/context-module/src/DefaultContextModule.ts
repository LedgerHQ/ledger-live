import { ContextModule } from "./ContextModule";
import { ContextLoader } from "./shared/domain/ContextLoader";
import { ClearSignContext } from "./shared/model/ClearSignContext";
import { TransactionContext } from "./shared/model/TransactionContext";

type DefaultContextModuleConstructorArgs = {
  loaders: ContextLoader[];
};

export class DefaultContextModule implements ContextModule {
  private _loaders: ContextLoader[];

  constructor(args: DefaultContextModuleConstructorArgs) {
    this._loaders = args.loaders;
  }

  public async getContexts(transaction: TransactionContext): Promise<ClearSignContext[]> {
    const promises = this._loaders.map(fetcher => fetcher.load(transaction));
    const responses = await Promise.all(promises);
    return responses.flat();
  }
}
