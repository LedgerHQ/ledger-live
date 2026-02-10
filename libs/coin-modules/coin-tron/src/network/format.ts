import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import bs58check from "bs58check";
import get from "lodash/get";
import { TrongridExtraTxInfo, TrongridTxInfo, TrongridTxType, TronTransactionInfo } from "../types";
import { TransactionTronAPI, Trc20API } from "./types";

export const decode58Check = (base58: string): string =>
  Buffer.from(bs58check.decode(base58)).toString("hex");

export const encode58Check = (hex: string): string => bs58check.encode(Buffer.from(hex, "hex"));

export const formatTrongridTrc20TxResponse = (tx: Trc20API): TrongridTxInfo | null | undefined => {
  try {
    const { from, to, block_timestamp, detail, value, transaction_id, token_info, type } = tx;
    const txID = transaction_id;
    let txType: TrongridTxType;
    let tokenId: string | undefined;
    const fee = tx.detail.ret[0].fee || undefined;
    const bnFee = new BigNumber(fee || 0);
    let formattedValue;

    switch (type) {
      case "Approval":
        txType = "ContractApproval";
        formattedValue = bnFee;
        break;
      default:
        txType = "TriggerSmartContract";
        tokenId = token_info.address ?? undefined;
        formattedValue = value ? new BigNumber(value) : new BigNumber(0);
        break;
    }

    const date = new Date(block_timestamp);

    const blockHeight = detail ? detail.blockNumber : undefined;
    return {
      txID,
      date,
      type: txType,
      tokenId: tokenId,
      tokenAddress: token_info.address,
      tokenType: "trc20",
      from,
      to,
      blockHeight,
      value: formattedValue,
      fee: bnFee,
      hasFailed: false, // trc20 txs are succeeded if returned by trongrid,
    };
  } catch (e) {
    log("tron-error", `could not parse transaction ${tx}`);
    throw e;
  }
};

export const formatTrongridTxResponse = (
  tx: TransactionTronAPI & { detail?: TronTransactionInfo },
): TrongridTxInfo | null | undefined => {
  try {
    const { txID, block_timestamp, detail, blockNumber, unfreeze_amount, withdraw_amount } = tx;
    const date = new Date(block_timestamp);
    const type = tx.raw_data.contract[0].type;
    const {
      amount,
      asset_name,
      owner_address,
      to_address,
      contract_address,
      quant,
      frozen_balance,
      votes,
      unfreeze_balance,
      balance,
      receiver_address,
    } = tx.raw_data.contract[0].parameter.value;
    const hasFailed = get(tx, "ret[0].contractRet", "SUCCESS") !== "SUCCESS";
    const tokenId =
      type === "TransferAssetContract"
        ? asset_name
        : type === "TriggerSmartContract" && contract_address
          ? encode58Check(contract_address)
          : undefined;
    const from = encode58Check(owner_address);
    const to = to_address ? encode58Check(to_address) : undefined;

    const getValue = (): BigNumber => {
      switch (type) {
        case "WithdrawBalanceContract":
          return new BigNumber(withdraw_amount || detail?.withdraw_amount || 0);

        case "ExchangeTransactionContract":
          return new BigNumber(quant || 0);

        default:
          return amount ? new BigNumber(amount) : new BigNumber(0);
      }
    };

    const value = getValue();
    const fee = get(tx, "ret[0].fee", detail && detail.fee ? detail.fee : undefined);
    const blockHeight = blockNumber || detail?.blockNumber;
    const txInfo: TrongridTxInfo = {
      txID,
      date,
      type,
      tokenId,
      // TRX native is TransferContract
      tokenType: type === "TransferAssetContract" ? "trc10" : undefined,
      from,
      to,
      value: !value.isNaN() ? value : new BigNumber(0),
      fee: new BigNumber(fee || 0),
      blockHeight,
      hasFailed,
    };

    const getExtra = (): TrongridExtraTxInfo | null | undefined => {
      switch (type) {
        case "VoteWitnessContract":
          return {
            votes: votes?.map(v => ({
              address: encode58Check(v.vote_address as string),
              voteCount: v.vote_count,
            })),
          };

        case "FreezeBalanceContract":
        case "FreezeBalanceV2Contract":
          return {
            frozenAmount: new BigNumber(frozen_balance!),
          };

        case "UnfreezeBalanceV2Contract":
          return {
            unfreezeAmount: new BigNumber(unfreeze_balance!),
          };

        case "UnDelegateResourceContract":
          return {
            unDelegatedAmount: new BigNumber(balance!),
            receiverAddress: encode58Check(receiver_address!),
          };

        case "UnfreezeBalanceContract":
          return {
            unfreezeAmount: new BigNumber(unfreeze_amount || detail!.unfreeze_amount!),
          };

        default:
          return undefined;
      }
    };

    const extra = getExtra();

    if (extra) {
      txInfo.extra = extra;
    }

    return txInfo;
  } catch {
    log("tron-error", "could not parse transaction", tx);
    return undefined;
  }
};
