import { ContextLoader } from "../../shared/domain/ContextLoader";
import { ClearSignContext } from "../../shared/model/ClearSignContext";
import { TransactionContext } from "../../shared/model/TransactionContext";
import { TokenDataSource } from "../data/TokenDataSource";

export enum ERC20_SUPPORTED_SELECTORS {
  Approve = "0x095ea7b3",
  Transfer = "0xa9059cbb",
}

const SUPPORTED_SELECTORS: `0x${string}`[] = Object.values(ERC20_SUPPORTED_SELECTORS);

export class TokenContextLoader implements ContextLoader {
  private _dataSource: TokenDataSource;

  constructor(dataSource: TokenDataSource) {
    this._dataSource = dataSource;
  }

  async load(transaction: TransactionContext): Promise<ClearSignContext[]> {
    if (!transaction.to || !transaction.data || transaction.data === "0x") {
      return [];
    }

    const selector = transaction.data.slice(0, 10) as `0x${string}`;

    if (!this.isSelectorSupported(selector)) {
      return [];
    }

    const payload = await this._dataSource.getTokenInfosPayload({
      address: transaction.to,
      chainId: transaction.chainId,
    });

    if (!payload) {
      return [];
    }

    return [
      {
        type: "provideERC20TokenInformation" as const,
        payload,
      },
    ];
  }

  private isSelectorSupported(selector: `0x${string}`) {
    return Object.values(SUPPORTED_SELECTORS).includes(selector);
  }
}
