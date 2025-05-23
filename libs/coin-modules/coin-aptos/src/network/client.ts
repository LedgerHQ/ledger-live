import { ApolloClient, InMemoryCache } from "@apollo/client";

import {
  AccountData,
  Aptos,
  AptosConfig,
  Ed25519PublicKey,
  GasEstimation,
  InputEntryFunctionData,
  InputGenerateTransactionOptions,
  MimeType,
  RawTransaction,
  SimpleTransaction,
  TransactionResponse,
  UserTransactionResponse,
  Block,
  AptosSettings,
  MoveFunctionId,
  Hex,
  postAptosFullNode,
  PendingTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import BigNumber from "bignumber.js";
import isUndefined from "lodash/isUndefined";
import { APTOS_ASSET_ID, DEFAULT_GAS, DEFAULT_GAS_PRICE, ESTIMATE_GAS_MUL } from "../constants";
import { isTestnet } from "../bridge/logic";
import type { AptosTransaction, TransactionOptions } from "../types";
import { GetAccountTransactionsData, GetAccountTransactionsDataGt } from "./graphql/queries";
import {
  GetAccountTransactionsDataQuery,
  GetAccountTransactionsDataGtQueryVariables,
} from "./graphql/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BlockInfo, FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { AptosAsset, AptosExtra, AptosFeeParameters, AptosSender } from "../types/assets";
import { log } from "@ledgerhq/logs";

const getApiEndpoint = (currencyId: string) =>
  isTestnet(currencyId) ? getEnv("APTOS_TESTNET_API_ENDPOINT") : getEnv("APTOS_API_ENDPOINT");
const getIndexerEndpoint = (currencyId: string) =>
  isTestnet(currencyId)
    ? getEnv("APTOS_TESTNET_INDEXER_ENDPOINT")
    : getEnv("APTOS_INDEXER_ENDPOINT");

export class AptosAPI {
  private readonly aptosConfig: AptosConfig;
  private readonly aptosClient: Aptos;
  private readonly apolloClient: ApolloClient<object>;

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
      uri: this.aptosConfig.indexer ?? "",
      cache: new InMemoryCache(),
      headers: {
        "x-client": "ledger-live",
      },
    });
  }

  async getAccount(address: string): Promise<AccountData> {
    return this.aptosClient.getAccountInfo({ accountAddress: address });
  }

  async getAccountInfo(address: string, startAt?: string) {
    const [balance, transactions, blockHeight] = await Promise.all([
      this.getCoinBalance(address, APTOS_ASSET_ID),
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

  async broadcast(tx: string): Promise<string> {
    const txBytes = Hex.fromHexString(tx).toUint8Array();

    const pendingTx = await postAptosFullNode<Uint8Array, PendingTransactionResponse>({
      aptosConfig: this.aptosClient.config,
      body: txBytes,
      path: "transactions",
      originMethod: "",
      contentType: MimeType.BCS_SIGNED_TRANSACTION,
    });

    return pendingTx.data.hash;
  }

  async getBalance(address: string, token: TokenCurrency): Promise<BigNumber> {
    if (token.tokenType === "coin") {
      return await this.getCoinBalance(address, token.contractAddress);
    } else {
      return await this.getFABalance(address, token.contractAddress);
    }
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

  async getCoinBalance(address: string, contract_address: string): Promise<BigNumber> {
    try {
      const [balanceStr] = await this.aptosClient.view<[string]>({
        payload: {
          function: "0x1::coin::balance",
          typeArguments: [contract_address],
          functionArguments: [address],
        },
      });
      const balance = parseInt(balanceStr, 10);
      return new BigNumber(balance);
    } catch (error) {
      log("error", "getCoinBalance", {
        error,
      });
      return new BigNumber(0);
    }
  }

  async getFABalance(address: string, contract_address: string): Promise<BigNumber> {
    try {
      const [balanceStr] = await this.aptosClient.view<[string]>({
        payload: {
          function: "0x1::primary_fungible_store::balance",
          typeArguments: ["0x1::object::ObjectCore"],
          functionArguments: [address, contract_address],
        },
      });
      const balance = parseInt(balanceStr, 10);
      return new BigNumber(balance);
    } catch (error) {
      log("error", "getFABalance", {
        error,
      });
      return new BigNumber(0);
    }
  }

  async estimateFees(
    transactionIntent: TransactionIntent<AptosAsset, AptosExtra, AptosSender>,
  ): Promise<FeeEstimation<AptosFeeParameters>> {
    const publicKeyEd = new Ed25519PublicKey(transactionIntent.sender.xpub);
    const fn: MoveFunctionId = "0x1::aptos_account::transfer_coins";

    const txPayload: InputEntryFunctionData = {
      function: fn,
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

    return Promise.all(
      queryResponse.data.account_transactions.map(({ transaction_version }) => {
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
      log("error", "richItemByVersion", {
        error,
      });
      return null;
    }
  }

  private async getHeight(): Promise<number> {
    const { data } = await network<Block>({
      method: "GET",
      url: this.aptosConfig.fullnode ?? "",
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
