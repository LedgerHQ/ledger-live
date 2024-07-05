import { ContextLoader } from "../../shared/domain/ContextLoader";
import { ClearSignContext } from "../../shared/model/ClearSignContext";
import { TransactionContext } from "../../shared/model/TransactionContext";
import { ForwardDomainDataSource } from "../data/ForwardDomainDataSource";

export class ForwardDomainContextLoader implements ContextLoader {
  private _dataSource: ForwardDomainDataSource;

  constructor(dataSource: ForwardDomainDataSource) {
    this._dataSource = dataSource;
  }

  async load(transactionContext: TransactionContext): Promise<ClearSignContext[]> {
    const { domain, challenge } = transactionContext;

    if (!domain) {
      return [];
    }

    if (!this.isDomainValid(domain as string)) {
      return [
        {
          type: "error" as const,
          error: new Error("[ContextModule] ForwardDomainLoader: invalid domain"),
        },
      ];
    }

    const payload = await this._dataSource.getDomainNamePayload({
      domain: domain!,
      challenge: challenge,
    });

    if (!payload) {
      return [
        {
          type: "error" as const,
          error: new Error("[ContextModule] ForwardDomainLoader: error getting domain payload"),
        },
      ];
    }

    return [{ type: "provideDomainName" as const, payload }];
  }

  // NOTE: duplicata of libs/domain-service/src/utils/index.ts
  private isDomainValid(domain: string) {
    const lengthIsValid = domain.length > 0 && Number(domain.length) < 30;
    const containsOnlyValidChars = new RegExp("^[a-zA-Z0-9\\-\\_\\.]+$").test(domain);

    return lengthIsValid && containsOnlyValidChars;
  }
}
