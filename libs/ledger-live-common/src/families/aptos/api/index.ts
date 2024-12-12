import { ApolloClient, InMemoryCache } from "@apollo/client";
import {
  AccountData,
  Aptos,
  AptosApiType,
  AptosConfig,
  Ed25519PublicKey,
  GasEstimation,
  InputEntryFunctionData,
  InputGenerateTransactionOptions,
  MimeType,
  post,
  RawTransaction,
  SimpleTransaction,
  TransactionResponse,
  UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import BigNumber from "bignumber.js";
import isUndefined from "lodash/isUndefined";
import { APTOS_ASSET_ID } from "../constants";
import { isTestnet } from "../logic";
import type { AptosTransaction, TransactionOptions } from "../types";
import {
  GetAccountTransactionsData,
  GetAccountTransactionsDataGt,
  GetAccountTransactionsDataLt,
} from "./graphql/queries";
import {
  GetAccountTransactionsDataQuery,
  GetAccountTransactionsDataQueryVariables,
} from "./graphql/types";

const getApiEndpoint = (currencyId: string) =>
  isTestnet(currencyId) ? getEnv("APTOS_TESTNET_API_ENDPOINT") : getEnv("APTOS_API_ENDPOINT");
const getIndexerEndpoint = (currencyId: string) =>
  isTestnet(currencyId)
    ? getEnv("APTOS_TESTNET_INDEXER_ENDPOINT")
    : getEnv("APTOS_INDEXER_ENDPOINT");

export class AptosAPI {
  private apiUrl: string;
  private indexerUrl: string;
  private aptosConfig: AptosConfig;
  private aptosClient: Aptos;
  private apolloClient: ApolloClient<object>;

  constructor(currencyId: string) {
    this.apiUrl = getApiEndpoint(currencyId);
    this.indexerUrl = getIndexerEndpoint(currencyId);
    this.aptosConfig = new AptosConfig({
      fullnode: this.apiUrl,
      indexer: this.indexerUrl,
    });
    this.aptosClient = new Aptos(this.aptosConfig);
    this.apolloClient = new ApolloClient({
      uri: this.indexerUrl,
      cache: new InMemoryCache(),
      headers: {
        "x-client": "ledger-live",
      },
    });
  }

  async getAccount(address: string): Promise<AccountData> {
    return this.aptosClient.getAccountInfo({ accountAddress: address });
  }

  async getAccountInfo(address: string, startAt: string) {
    const [balance, transactions, blockHeight] = await Promise.all([
      this.getBalance(address),
      this.fetchTransactions(address, undefined, startAt),
      this.getHeight(),
    ]);

    return {
      balance,
      transactions,
      blockHeight,
    };
  }

  async estimateGasPrice(): Promise<GasEstimation> {
    return this.aptosClient.getGasPriceEstimation();
  }

  async generateTransaction(
    address: string,
    payload: InputEntryFunctionData,
    options: TransactionOptions,
  ): Promise<RawTransaction> {
    const opts: Partial<InputGenerateTransactionOptions> = {};
    if (!isUndefined(options.maxGasAmount)) {
      opts.maxGasAmount = Number(options.maxGasAmount);
    }

    if (!isUndefined(options.gasUnitPrice)) {
      opts.gasUnitPrice = Number(options.gasUnitPrice);
    }

    if (!isUndefined(options.sequenceNumber)) {
      opts.accountSequenceNumber = Number(options.sequenceNumber);
    }

    if (!isUndefined(options.expirationTimestampSecs)) {
      opts.expireTimestamp = Number(options.expirationTimestampSecs);
    } else {
      try {
        const ts = (await this.aptosClient.getLedgerInfo()).ledger_timestamp;
        opts.expireTimestamp = Number(Math.ceil(+ts / 1_000_000 + 2 * 60)); // in microseconds
      } catch (_) {
        // skip
      }
    }

    return this.aptosClient.transaction.build
      .simple({
        sender: address,
        data: payload,
        options: opts,
      })
      .then(t => t.rawTransaction)
      .catch((error: any) => {
        throw error;
      });
  }

  async simulateTransaction(
    address: Ed25519PublicKey,
    tx: RawTransaction,
    options = {
      estimateGasUnitPrice: true,
      estimateMaxGasAmount: true,
      estimatePrioritizedGasUnitPrice: false,
    },
  ): Promise<UserTransactionResponse[]> {
    return this.aptosClient.transaction.simulate.simple({
      signerPublicKey: address,
      transaction: { rawTransaction: tx } as SimpleTransaction,
      options,
    });
  }

  async broadcast(signature: string): Promise<string> {
    const txBytes = Uint8Array.from(Buffer.from(signature, "hex"));
    const pendingTx = await post({
      contentType: MimeType.BCS_SIGNED_TRANSACTION,
      aptosConfig: this.aptosClient.config,
      body: txBytes,
      path: "transactions",
      type: AptosApiType.FULLNODE,
      originMethod: "",
    });
    return (pendingTx.data as TransactionResponse).hash;
  }

  private async getBalance(address: string): Promise<BigNumber> {
    try {
      const [balanceStr] = await this.aptosClient.view<[string]>({
        payload: {
          function: "0x1::coin::balance",
          typeArguments: [APTOS_ASSET_ID],
          functionArguments: [address],
        },
      });
      const balance = parseInt(balanceStr, 10);
      return new BigNumber(balance);
    } catch (e: any) {
      return new BigNumber(0);
    }
  }

  private async fetchTransactions(address: string, lt?: string, gt?: string) {
    if (!address) {
      return [];
    }

    // WORKAROUND: Where is no way to pass optional bigint var to query
    let query = GetAccountTransactionsData;
    if (lt) {
      query = GetAccountTransactionsDataLt;
    }
    if (gt) {
      query = GetAccountTransactionsDataGt;
    }

    const queryResponse = await this.apolloClient.query<
      GetAccountTransactionsDataQuery,
      GetAccountTransactionsDataQueryVariables
    >({
      query,
      variables: {
        address,
        limit: 1000,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        lt,
        gt,
      },
      fetchPolicy: "network-only",
    });

    return Promise.all(
      queryResponse.data.address_version_from_move_resources.map(({ transaction_version }) => {
        return this.richItemByVersion(transaction_version);
      }),
    );
  }

  private async richItemByVersion(version: number): Promise<AptosTransaction | null> {
    try {
      const tx: TransactionResponse = await this.aptosClient.getTransactionByVersion({
        ledgerVersion: version,
      });
      const block = await this.getBlock(version);
      return {
        ...tx,
        block,
      } as AptosTransaction;
    } catch (error) {
      return null;
    }
  }

  private async getHeight(): Promise<number> {
    const { data } = await network({
      method: "GET",
      url: this.apiUrl,
    });
    return parseInt(data.block_height);
  }

  private async getBlock(version: number) {
    const block = await this.aptosClient.getBlockByVersion({ ledgerVersion: version });
    return {
      height: parseInt(block.block_height),
      hash: block.block_hash,
    };
  }
}
