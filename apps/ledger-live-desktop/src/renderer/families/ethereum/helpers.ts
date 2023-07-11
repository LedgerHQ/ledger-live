import BigNumber from "bignumber.js";
import {
  Transaction as EthereumTransaction,
  TransactionMode,
} from "@ledgerhq/live-common/families/ethereum/types";
import { AnyMessage, NFTStandard } from "@ledgerhq/types-live";
import { getEIP712FieldsDisplayedOnNano } from "@ledgerhq/evm-tools/message/EIP712/index";
import { MessageProperties, NftProperties } from "../types";
import { getEnv } from "@ledgerhq/live-env";

export const getNftTransactionProperties = (transaction: EthereumTransaction): NftProperties => ({
  tokenId: transaction?.tokenIds?.[0] || null,
  contract: transaction?.collection || null,
  quantity: transaction?.quantities?.[0] || null,
});

export const injectNftIntoTransaction = (
  transaction: EthereumTransaction,
  nftProperties: Partial<NftProperties>,
  standard?: NFTStandard,
): EthereumTransaction => ({
  ...transaction,
  mode: standard ? (`${standard.toLowerCase()}.transfer` as TransactionMode) : transaction.mode,
  collection: nftProperties?.contract ?? transaction?.collection ?? "",
  tokenIds: [nftProperties?.tokenId ?? transaction.tokenIds?.[0] ?? ""],
  quantities: [nftProperties?.quantity ?? transaction.quantities?.[0] ?? new BigNumber(NaN)],
});

export const getMessageProperties = async (
  messageData: AnyMessage,
): Promise<MessageProperties | null> => {
  if (messageData.standard === "EIP712") {
    return getEIP712FieldsDisplayedOnNano(messageData.message, getEnv("DYNAMIC_CAL_BASE_URL"));
  }

  return null;
};
