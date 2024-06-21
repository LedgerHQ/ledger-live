import { ContextLoader } from "../../shared/domain/ContextLoader";
import { ClearSignContext } from "../../shared/model/ClearSignContext";
import { TransactionContext } from "../../shared/model/TransactionContext";
import { NftDataSource } from "../data/NftDataSource";

enum ERC721_SUPPORTED_SELECTOR {
  Approve = "0x095ea7b3",
  SetApprovalForAll = "0xa22cb465",
  TransferFrom = "0x23b872dd",
  SafeTransferFrom = "0x42842e0e",
  SafeTransferFromWithData = "0xb88d4fde",
}

enum ERC1155_SUPPORTED_SELECTOR {
  SetApprovalForAll = "0xa22cb465",
  SafeTransferFrom = "0xf242432a",
  SafeBatchTransferFrom = "0x2eb2c2d6",
}

const SUPPORTED_SELECTORS: `0x${string}`[] = [
  ...Object.values(ERC721_SUPPORTED_SELECTOR),
  ...Object.values(ERC1155_SUPPORTED_SELECTOR),
];

export class NftContextLoader implements ContextLoader {
  private _dataSource: NftDataSource;

  constructor(dataSource: NftDataSource) {
    this._dataSource = dataSource;
  }

  async load(transaction: TransactionContext): Promise<ClearSignContext[]> {
    const responses: ClearSignContext[] = [];

    if (!transaction.to || !transaction.data || transaction.data === "0x") {
      return [];
    }

    const selector = transaction.data.slice(0, 10) as `0x${string}`;

    if (!this.isSelectorSupported(selector)) {
      return [];
    }

    // EXAMPLE:
    // https://nft.api.live.ledger.com/v1/ethereum/1/contracts/0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D/plugin-selector/0x095ea7b3
    const setPluginPayload = await this._dataSource.getSetPluginPayload({
      chainId: transaction.chainId,
      address: transaction.to,
      selector,
    });

    if (!setPluginPayload) {
      return [
        {
          type: "error" as const,
          error: new Error("[ContextModule] NftLoader: unexpected empty response"),
        },
      ];
    }

    responses.push({ type: "setPlugin", payload: setPluginPayload });

    const nftInformationsPayload = await this._dataSource.getNftInfosPayload({
      chainId: transaction.chainId,
      address: transaction.to,
    });

    if (!nftInformationsPayload) {
      return [
        { type: "error" as const, error: new Error("[ContextModule] NftLoader: no nft metadata") },
      ];
    }

    responses.push({ type: "provideNFTInformation", payload: nftInformationsPayload });

    return responses;
  }

  private isSelectorSupported(selector: `0x${string}`) {
    return Object.values(SUPPORTED_SELECTORS).includes(selector);
  }
}
