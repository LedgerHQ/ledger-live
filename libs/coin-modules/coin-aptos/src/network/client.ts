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
  PostRequestOptions,
  Block,
  AptosSettings,
  MoveFunctionId,
} from "@aptos-labs/ts-sdk";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import type { Pagination } from "@ledgerhq/coin-framework/api/types";
import BigNumber from "bignumber.js";
import isUndefined from "lodash/isUndefined";
import { APTOS_ASSET_ID, DEFAULT_GAS, DEFAULT_GAS_PRICE, ESTIMATE_GAS_MUL } from "../constants";
import { isTestnet } from "../bridge/logic";
import type { AptosTransaction, TransactionOptions } from "../types";
import {
  GetAccountTransactionsData,
  GetAccountTransactionsDataGt,
  GetAccountTransactionsV2Data,
} from "./graphql/queries";
import {
  GetAccountTransactionsDataQuery,
  GetAccountTransactionsDataGtQueryVariables,
  GetAccountTransactionsV2DataQuery,
  GetAccountTransactionsV2DataQueryVariables,
} from "./graphql/types";
import {
  Operation,
  BlockInfo,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import { AptosAsset, AptosExtra, AptosFeeParameters, AptosSender } from "../types/assets";

const getApiEndpoint = (currencyId: string) =>
  isTestnet(currencyId) ? getEnv("APTOS_TESTNET_API_ENDPOINT") : getEnv("APTOS_API_ENDPOINT");
const getIndexerEndpoint = (currencyId: string) =>
  isTestnet(currencyId)
    ? getEnv("APTOS_TESTNET_INDEXER_ENDPOINT")
    : getEnv("APTOS_INDEXER_ENDPOINT");

export class AptosAPI {
  private aptosConfig: AptosConfig;
  private aptosClient: Aptos;
  private apolloClient: ApolloClient<object>;

  constructor(currencyIdOrSettings: AptosSettings | string) {
    if (typeof currencyIdOrSettings === "string") {
      this.aptosConfig = new AptosConfig({
        fullnode: getApiEndpoint(currencyIdOrSettings),
        indexer: getIndexerEndpoint(currencyIdOrSettings),
      });
    } else {
      this.aptosConfig = new AptosConfig(currencyIdOrSettings);
    }

    this.aptosClient = new Aptos(this.aptosConfig);
    this.apolloClient = new ApolloClient({
      uri: this.aptosConfig.indexer || "",
      cache: new InMemoryCache(),
      headers: {
        "x-client": "ledger-live",
      },
    });
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
    } catch (_) {
      return new BigNumber(0);
    }
  }

  private async fetchTransactions(address: string, gt?: string) {
    if (!address) {
      return [];
    }

    let query = GetAccountTransactionsData;
    if (gt) {
      query = GetAccountTransactionsDataGt;
    }

    const queryResponse = await this.apolloClient.query<
      GetAccountTransactionsDataQuery,
      GetAccountTransactionsDataGtQueryVariables
    >({
      query,
      variables: {
        address,
        limit: 1000,
        gt,
      },
      fetchPolicy: "network-only",
    });

    console.log("queryResponse!", queryResponse);

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
    const { data } = await network<Block>({
      method: "GET",
      url: this.aptosConfig.fullnode || "",
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

  async getAccount(address: string): Promise<AccountData> {
    return this.aptosClient.getAccountInfo({ accountAddress: address });
  }

  async getAccountInfo(address: string, startAt: string) {
    const [balance, transactions, blockHeight] = await Promise.all([
      this.getBalance(address),
      this.fetchTransactions(address, startAt),
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

    try {
      const { ledger_timestamp } = await this.aptosClient.getLedgerInfo();
      opts.expireTimestamp = Number(Math.ceil(+ledger_timestamp / 1_000_000 + 2 * 60)); // in milliseconds
    } catch {
      // skip
    }

    return this.aptosClient.transaction.build
      .simple({
        sender: address,
        data: payload,
        options: opts,
      })
      .then(t => t.rawTransaction)
      .catch(error => {
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
    const pendingTx = await post<PostRequestOptions, TransactionResponse>({
      contentType: MimeType.BCS_SIGNED_TRANSACTION,
      aptosConfig: this.aptosClient.config,
      body: txBytes,
      path: "transactions",
      type: AptosApiType.FULLNODE,
      originMethod: "",
    });
    return pendingTx.data.hash;
  }

  async getLastBlock(): Promise<BlockInfo> {
    const { block_height } = await this.aptosClient.getLedgerInfo();
    const block = await this.aptosClient.getBlockByHeight({ blockHeight: Number(block_height) });
    return {
      height: Number(block.block_height),
      hash: block.block_hash,
      time: new Date(Number(block.block_timestamp)),
    };
  }

  async estimateFees(
    transactionIntent: TransactionIntent<AptosAsset, AptosExtra, AptosSender>,
  ): Promise<FeeEstimation<AptosFeeParameters>> {
    const publicKeyEd = new Ed25519PublicKey(transactionIntent.sender.xpub);
    const txPayload: InputEntryFunctionData = {
      function: transactionIntent.asset.function as MoveFunctionId,
      typeArguments: [APTOS_ASSET_ID],
      functionArguments: [transactionIntent.recipient, transactionIntent.amount],
    };

    const txOptions: TransactionOptions = {
      maxGasAmount: DEFAULT_GAS.toString(),
      gasUnitPrice: DEFAULT_GAS_PRICE.toString(),
    };

    const tx = await this.generateTransaction(
      transactionIntent.sender.freshAddress,
      txPayload,
      txOptions,
    );

    const simulation = await this.simulateTransaction(publicKeyEd, tx);
    const completedTx = simulation[0];

    const gasLimit = new BigNumber(completedTx.gas_used).multipliedBy(ESTIMATE_GAS_MUL);
    const gasPrice = new BigNumber(completedTx.gas_unit_price);

    const expectedGas = gasPrice.multipliedBy(gasLimit);

    return {
      value: BigInt(expectedGas.toString()),
      parameters: {
        gasLimit: BigInt(gasLimit.toString()),
        gasPrice: BigInt(gasPrice.toString()),
      },
    };
  }

  private async accountTransactions(address: string) {
    if (!address) {
      return [];
    }

    const query = GetAccountTransactionsV2Data;

    const variables: GetAccountTransactionsV2DataQueryVariables = {
      address,
      limit: 1000,
    };

    const queryResponse = await this.apolloClient.query<
      GetAccountTransactionsV2DataQuery,
      GetAccountTransactionsV2DataQueryVariables
    >({
      query,
      variables,
      fetchPolicy: "network-only",
    });

    console.log("query", query);
    console.log("variables", variables);
    console.log("queryResponse", queryResponse);

    return queryResponse;

    // return Promise.all(
    //   queryResponse.data.map(({ transaction_version }) => {
    //     return this.richItemByVersion(transaction_version);
    //   }),
    // );
  }

  async listOperations(
    address: string,
    _pagination: Pagination,
  ): Promise<[Operation<AptosAsset>[], string]> {
    const txs = await this.accountTransactions(address);
    await this.fetchTransactions(address);
    // const transactions = await this.accountTransactions(address, 0);
    console.log("txs", txs);
    // const ops = txsToOps(
    //   address,
    //   transactions.filter(tx => tx !== null),
    // );

    return [[], ""];
  }
}

// function txsToOps(_address: string, transactions: AptosTransaction[]): Operation<AptosAsset>[] {
//   return transactions.map((tx: AptosTransaction) => ({
//     id: "tx.id",
//     tx: {
//       hash: tx.hash,
//       block: { height: tx.block?.height },
//       fees: BigInt(
//         BigNumber(tx.gas_used).multipliedBy(new BigNumber(tx.gas_unit_price)).toString(),
//       ),
//       date: new Date(parseInt(tx.timestamp) / 1000),
//     },
//     type: "inferOperationType(trongridTxInfo, userAddress)",
//     value: BigInt(0), //"fromBigNumberToBigInt<bigint>(trongridTxInfo.value, BigInt(0))",
//     senders: ["trongridTxInfo.from"],
//     recipients: ["trongridTxInfo.to != null ? [trongridTxInfo.to] : []"],
//     asset: { type: "native" }, //"inferAssetInfo(trongridTxInfo)",
//   }));
// }
