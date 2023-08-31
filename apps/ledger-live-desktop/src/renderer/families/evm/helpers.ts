import BigNumber from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import { NFTStandard, AnyMessage, Account } from "@ledgerhq/types-live";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { getEIP712FieldsDisplayedOnNano } from "@ledgerhq/evm-tools/message/EIP712/index";
import { NftProperties, MessageProperties } from "../types";

export const getNftTransactionProperties = (transaction: EvmTransaction): NftProperties => ({
  tokenId: transaction.nft?.tokenId || null,
  contract: transaction.nft?.contract || null,
  quantity: transaction.nft?.quantity || null,
});

export const injectNftIntoTransaction = (
  transaction: EvmTransaction,
  nftProperties: Partial<NftProperties>,
  standard?: NFTStandard,
): EvmTransaction => ({
  ...transaction,
  mode: (standard ? standard.toLowerCase() : transaction.mode) as Lowercase<NFTStandard>,
  nft: {
    collectionName: transaction.nft?.collectionName ?? "",
    contract: nftProperties?.contract ?? transaction.nft?.contract ?? "",
    tokenId: nftProperties?.tokenId ?? transaction.nft?.tokenId ?? "",
    quantity: nftProperties?.quantity ?? transaction.nft?.quantity ?? new BigNumber(NaN),
  },
});

export const getMessageProperties = async (
  account: Account,
  messageData: AnyMessage,
): Promise<MessageProperties | null> => {
  if (messageData.standard === "EIP712") {
    return getEIP712FieldsDisplayedOnNano(messageData.message, getEnv("DYNAMIC_CAL_BASE_URL"));
  }
  return null;
};
