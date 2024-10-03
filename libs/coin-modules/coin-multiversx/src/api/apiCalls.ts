import network from "@ledgerhq/live-network";
import { SignedOperation } from "@ledgerhq/types-live/src";
import { MAX_PAGINATION_SIZE, METACHAIN_SHARD } from "../constants";
import {
  ESDTToken,
  MultiversXApiTransaction,
  MultiversXDelegation,
  MultiversXProvider,
  MultiversXTransactionAction,
  MultiversXTransactionMode,
  MultiversXTransferOptions,
  NetworkInfo,
} from "../types";
import { MultiversXAccount } from "./dtos/multiversx-account";

interface NetworkInfoResponse {
  data: {
    config: {
      erd_chain_id: string;
      erd_denomination: number;
      erd_min_gas_limit: number;
      erd_min_gas_price: number;
      erd_gas_per_data_byte: number;
      erd_gas_price_modifier: string;
    };
  };
}

interface SubmitTransactionResponse {
  data: {
    txHash: string;
  };
}

interface BlockRoundResponse {
  round: number;
}

const decodeTransactionMode = (action?: MultiversXTransactionAction): string => {
  if (!action) {
    return "send";
  }

  if (!action.category) {
    return "send";
  }

  if (action.category !== "stake") {
    return "send";
  }

  const mode = action.name;

  return mode;
};

export default class MultiversXApi {
  private API_URL: string;
  private DELEGATION_API_URL: string;

  constructor(API_URL: string, DELEGATION_API_URL: string) {
    this.API_URL = API_URL;
    this.DELEGATION_API_URL = DELEGATION_API_URL;
  }

  async getAccountDetails(addr: string) {
    const {
      data: { balance, nonce, isGuarded },
    } = await network<MultiversXAccount>({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}?withGuardianInfo=true`,
    });

    return {
      balance,
      nonce,
      isGuarded,
    };
  }

  async getProviders(): Promise<MultiversXProvider[]> {
    const { data: providers } = await network<MultiversXProvider[]>({
      method: "GET",
      url: `${this.DELEGATION_API_URL}/providers`,
    });

    return providers;
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
    } = await network<NetworkInfoResponse>({
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

  async submit(signedOperation: SignedOperation): Promise<string> {
    const transaction = {
      ...signedOperation.rawData,
      signature: signedOperation.signature,
    };

    const {
      data: {
        data: { txHash: hash },
      },
    } = await network<SubmitTransactionResponse>({
      method: "POST",
      url: `${this.API_URL}/transaction/send`,
      data: transaction,
    });

    return hash;
  }

  async getHistory(addr: string, startAt: number): Promise<MultiversXApiTransaction[]> {
    const { data: transactionsCount } = await network<number>({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}/transactions/count?after=${startAt}`,
    });

    let allTransactions: MultiversXApiTransaction[] = [];
    let from = 0;
    while (from < transactionsCount) {
      const { data: transactions } = await network<MultiversXApiTransaction[]>({
        method: "GET",
        url: `${this.API_URL}/accounts/${addr}/transactions?after=${startAt}&from=${from}&size=${MAX_PAGINATION_SIZE}&withOperations=true&withScResults=true`,
      });

      for (const transaction of transactions) {
        transaction.mode = decodeTransactionMode(transaction.action) as MultiversXTransactionMode;
      }

      allTransactions = [...allTransactions, ...transactions];

      from = from + MAX_PAGINATION_SIZE;
    }

    return allTransactions;
  }

  async getAccountDelegations(addr: string): Promise<MultiversXDelegation[]> {
    const { data: delegations } = await network<MultiversXDelegation[]>({
      method: "GET",
      url: `${this.DELEGATION_API_URL}/accounts/${addr}/delegations`,
    });

    return delegations;
  }

  async getESDTTransactionsForAddress(
    addr: string,
    token: string,
    startAt: number,
  ): Promise<MultiversXApiTransaction[]> {
    const { data: tokenTransactionsCount } = await network<number>({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}/transactions/count?token=${token}&after=${startAt}`,
    });

    let allTokenTransactions: MultiversXApiTransaction[] = [];
    let from = 0;
    while (from < tokenTransactionsCount) {
      const { data: tokenTransactions } = await network<MultiversXApiTransaction[]>({
        method: "GET",
        url: `${this.API_URL}/accounts/${addr}/transactions?token=${token}&from=${from}&after=${startAt}&size=${MAX_PAGINATION_SIZE}`,
      });

      allTokenTransactions = [...allTokenTransactions, ...tokenTransactions];

      from = from + MAX_PAGINATION_SIZE;
    }

    for (const esdtTransaction of allTokenTransactions) {
      esdtTransaction.transfer = MultiversXTransferOptions.esdt;
    }

    return allTokenTransactions;
  }

  async getESDTTokensForAddress(addr: string): Promise<ESDTToken[]> {
    const { data: tokensCount } = await network<number>({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}/tokens/count`,
    });

    let allTokens: ESDTToken[] = [];
    let from = 0;
    while (from < tokensCount) {
      const { data: tokens } = await network<ESDTToken[]>({
        method: "GET",
        url: `${this.API_URL}/accounts/${addr}/tokens?from=${from}&size=${MAX_PAGINATION_SIZE}`,
      });

      allTokens = [...allTokens, ...tokens];

      from = from + MAX_PAGINATION_SIZE;
    }

    return allTokens;
  }

  async getESDTTokensCountForAddress(addr: string): Promise<number> {
    const { data: tokensCount } = await network<number>({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}/tokens/count`,
    });

    return tokensCount;
  }

  async getBlockchainBlockHeight(): Promise<number> {
    const {
      data: [{ round: blockHeight }],
    } = await network<BlockRoundResponse[]>({
      method: "GET",
      url: `${this.API_URL}/blocks?shard=${METACHAIN_SHARD}&fields=round`,
    });
    return blockHeight;
  }
}
