import { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { decode58Check } from "../network/format";
import { SendTransactionData, SmartContractTransactionData } from "../types";
import { abiEncodeTrc20Transfer } from "../network/utils";
import BigNumber from "bignumber.js";
import { extendTronTxExpirationTimeBy10mn, post } from "../network";

export async function craftTransaction(transactionIntent: TransactionIntent): Promise<string> {
  // trc20
  if (transactionIntent.standard === "trc20" && transactionIntent.tokenAddress) {
    const txData: SmartContractTransactionData = {
      function_selector: "transfer(address,uint256)",
      fee_limit: 50000000,
      call_value: 0,
      contract_address: decode58Check(transactionIntent.tokenAddress),
      parameter: abiEncodeTrc20Transfer(
        decode58Check(transactionIntent.recipient),
        new BigNumber(transactionIntent.amount.toString()),
      ),
      owner_address: decode58Check(transactionIntent.sender),
    };
    const url = `/wallet/triggersmartcontract`;
    const { transaction: preparedTransaction } = await post(url, txData);
    const { raw_data_hex: rawDataHex } =
      await extendTronTxExpirationTimeBy10mn(preparedTransaction);
    return rawDataHex as string;
  } else {
    // trx/trc10
    const txData: SendTransactionData = {
      to_address: decode58Check(transactionIntent.recipient),
      owner_address: decode58Check(transactionIntent.sender),
      amount: Number(transactionIntent.amount),
      asset_name:
        transactionIntent.tokenAddress &&
        Buffer.from(transactionIntent.tokenAddress).toString("hex"),
    };
    const isTransferAsset =
      transactionIntent.tokenAddress && transactionIntent.tokenAddress.length > 0 ? true : false;
    const url = isTransferAsset ? `/wallet/transferasset` : `/wallet/createtransaction`;
    const preparedTransaction = await post(url, txData);
    // for the ledger Vault we need to increase the expiration
    const { raw_data_hex: rawDataHex } =
      await extendTronTxExpirationTimeBy10mn(preparedTransaction);
    return rawDataHex as string;
  }
}
