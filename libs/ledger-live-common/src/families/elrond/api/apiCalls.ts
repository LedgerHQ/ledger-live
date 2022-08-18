import BigNumber from "bignumber.js";
import network from "../../../network";
import { BinaryUtils } from "../utils/binary.utils";
import {
  HASH_TRANSACTION,
  METACHAIN_SHARD,
  MAX_PAGINATION_SIZE,
  GAS,
} from "../constants";
import {
  ElrondDelegation,
  ElrondProtocolTransaction,
  ElrondTransferOptions,
  ESDTToken,
  NetworkInfo,
  Transaction,
} from "../types";
import { decodeTransaction } from "./sdk";
import { Operation } from "@ledgerhq/types-live";
export default class ElrondApi {
  private API_URL: string;
  private DELEGATION_API_URL: string;

  constructor(API_URL: string, DELEGATION_API_URL: string) {
    this.API_URL = API_URL;
    this.DELEGATION_API_URL = DELEGATION_API_URL;
  }

  async getAccountDetails(addr: string) {
    const {
      data: { balance, nonce },
    } = await network({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}`,
    });

    return {
      balance,
      nonce,
    };
  }

  async getProviders(): Promise<any> {
    let data = [];

    try {
      const {
        data: { providers },
      } = await network({
        method: "GET",
        url: `${this.DELEGATION_API_URL}/providers`,
      });
      data = providers;
    } catch (error) {
      return data;
    }

    return data;
  }

  async getNetworkConfig(): Promise<NetworkInfo> {
    const {
      data: {
        data: {
          config: {
            erd_chain_id: chainId,
            erd_denomination: denomination,
            erd_min_gas_limit: gasLimit,
            erd_min_gas_price: gasPrice,
            erd_gas_per_data_byte: gasPerByte,
            erd_gas_price_modifier: gasPriceModifier,
          },
        },
      },
    } = await network({
      method: "GET",
      url: `${this.API_URL}/network/config`,
    });

    return {
      chainID: chainId,
      denomination,
      gasLimit,
      gasPrice,
      gasPerByte,
      gasPriceModifier,
    };
  }

  async submit(operation: Operation, signature: string): Promise<string> {
    const networkConfig: NetworkInfo = await this.getNetworkConfig();
    const { chainID, gasPrice } = networkConfig;
    let gasLimit = networkConfig.gasLimit;

    const {
      senders: [sender],
      recipients: [receiver],
      transactionSequenceNumber: nonce,
      extra: { data },
    } = operation;
    let { value } = operation;

    if (data) {
      const dataDecoded = BinaryUtils.base64Decode(data);

      const funcName: string = dataDecoded.split("@")[0];
      switch (funcName) {
        case "ESDTTransfer":
          value = new BigNumber(0);
          gasLimit = GAS.ESDT_TRANSFER;
          break;
        case "delegate":
          gasLimit = GAS.DELEGATE;
          break;
        case "claimRewards":
          value = new BigNumber(0);
          gasLimit = GAS.CLAIM;
          break;
        case "withdraw":
          value = new BigNumber(0);
          gasLimit = GAS.DELEGATE;
          break;
        case "reDelegateRewards":
          value = new BigNumber(0);
          gasLimit = GAS.DELEGATE;
          break;
        case "unDelegate":
          value = new BigNumber(0);
          gasLimit = GAS.DELEGATE;
          break;
        default:
          throw new Error(`Invalid function name ${funcName}`);
      }
    }

    const transaction: ElrondProtocolTransaction = {
      nonce: nonce ?? 0,
      value: value.toString(),
      receiver,
      sender,
      gasPrice,
      gasLimit,
      chainID,
      signature,
      data,
      ...HASH_TRANSACTION,
    };

    const {
      data: {
        data: { txHash: hash },
      },
    } = await network({
      method: "POST",
      url: `${this.API_URL}/transaction/send`,
      data: transaction,
    });

    return hash;
  }

  async getHistory(addr: string, startAt: number): Promise<Transaction[]> {
    const { data: transactionsCount } = await network({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}/transactions/count?after=${startAt}`,
    });

    let allTransactions: Transaction[] = [];
    let from = 0;
    let before = Math.floor(Date.now() / 1000);
    while (from <= transactionsCount) {
      let { data: transactions } = await network({
        method: "GET",
        url: `${this.API_URL}/accounts/${addr}/transactions?after=${startAt}&before=${before}&size=${MAX_PAGINATION_SIZE}`,
      });

      transactions = transactions.map((transaction) =>
        decodeTransaction(transaction)
      );

      allTransactions = [...allTransactions, ...transactions];

      from = from + MAX_PAGINATION_SIZE;
      before = transactions.slice(-1).timestamp;
    }

    return allTransactions;
  }

  async getAccountDelegations(addr: string): Promise<ElrondDelegation[]> {
    const { data: delegations } = await network({
      method: "GET",
      url: `${this.DELEGATION_API_URL}/accounts/${addr}/delegations`,
    });

    return delegations;
  }

  async getESDTTransactionsForAddress(
    addr: string,
    token: string
  ): Promise<Transaction[]> {
    const { data: tokenTransactionsCount } = await network({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}/transactions/count?token=${token}`,
    });

    let allTokenTransactions: Transaction[] = [];
    let from = 0;
    let before = Math.floor(Date.now() / 1000);
    while (from <= tokenTransactionsCount) {
      const { data: tokenTransactions } = await network({
        method: "GET",
        url: `${this.API_URL}/accounts/${addr}/transactions?token=${token}&before=${before}&size=${MAX_PAGINATION_SIZE}`,
      });

      allTokenTransactions = [...allTokenTransactions, ...tokenTransactions];

      from = from + MAX_PAGINATION_SIZE;
      before = tokenTransactions.slice(-1).timestamp;
    }

    for (const esdtTransaction of allTokenTransactions) {
      esdtTransaction.transfer = ElrondTransferOptions.esdt;
    }

    return allTokenTransactions;
  }

  async getESDTTokensForAddress(addr: string): Promise<ESDTToken[]> {
    const { data: tokensCount } = await network({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}/tokens/count`,
    });

    let allTokens: ESDTToken[] = [];
    let from = 0;
    while (from <= tokensCount) {
      const { data: tokens } = await network({
        method: "GET",
        url: `${this.API_URL}/accounts/${addr}/tokens?from=${from}&size=${MAX_PAGINATION_SIZE}`,
      });

      allTokens = [...allTokens, ...tokens];

      from = from + MAX_PAGINATION_SIZE;
    }

    return allTokens;
  }

  async getESDTTokensCountForAddress(addr: string): Promise<number> {
    const { data: tokensCount } = await network({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}/tokens/count`,
    });

    return tokensCount;
  }

  async getBlockchainBlockHeight(): Promise<number> {
    const {
      data: [{ round: blockHeight }],
    } = await network({
      method: "GET",
      url: `${this.API_URL}/blocks?shard=${METACHAIN_SHARD}&fields=round`,
    });
    return blockHeight;
  }
}
