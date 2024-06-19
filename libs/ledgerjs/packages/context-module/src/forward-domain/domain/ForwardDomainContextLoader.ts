import { ContextLoader } from "../../shared/domain/ContextLoader";
import { ContextResponse } from "../../shared/model/ContextResponse";
import { LoaderOptions } from "../../shared/model/LoaderOptions";
import { Transaction } from "../../shared/model/Transaction";
import { ForwardDomainDataSource } from "../data/ForwardDomainDataSource";

export class ForwardDomainContextLoader implements ContextLoader {
  private _dataSource: ForwardDomainDataSource;

  constructor(dataSource: ForwardDomainDataSource) {
    this._dataSource = dataSource;
  }

  async load(_transaction: Transaction, options: LoaderOptions): Promise<ContextResponse[]> {
    const { domain, registry } = options.options?.forwardDomain || {};
    if (!domain && !registry) {
      return [];
    }

    if ((domain && !registry) || (!domain && registry)) {
      throw new Error(
        "[ContextModule] ForwardDomainLoader: Invalid combination of domain and registry. Either both domain and registry should exist",
      );
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
      challenge: options.challenge,
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
