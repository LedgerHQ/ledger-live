import { ApolloClient, InMemoryCache } from "@apollo/client";
import {
  type AccountData,
  Aptos,
  AptosConfig,
  Ed25519PublicKey,
  type GasEstimation,
  type InputEntryFunctionData,
  type InputGenerateTransactionOptions,
  MimeType,
  MoveStructId,
  type RawTransaction,
  type SimpleTransaction,
  type TransactionResponse,
  type UserTransactionResponse,
  type Block,
  type AptosSettings,
  Hex,
  postAptosFullNode,
  type PendingTransactionResponse,
  Network,
} from "@aptos-labs/ts-sdk";
import {
  BlockInfo,
  FeeEstimation,
  Operation,
  Page,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import isUndefined from "lodash/isUndefined";
import {
  APTOS_ASSET_ID,
  DEFAULT_GAS,
  DEFAULT_GAS_PRICE,
  ESTIMATE_GAS_MUL,
  TOKEN_TYPE,
} from "../constants";
import { isTestnet } from "../logic/isTestnet";
import { normalizeAddress } from "../logic/normalizeAddress";
import { transactionsToOperations } from "../logic/transactionsToOperations";
import type {
  AptosBalance,
  AptosTransaction,
  StakePoolResource,
  TransactionOptions,
} from "../types";
import { GetAccountTransactionsData, GetAccountTransactionsDataGt } from "./graphql/queries";
import type {
  GetAccountTransactionsDataQuery,
  GetAccountTransactionsDataGtQueryVariables,
  TransactionVersion,
} from "./graphql/types";

const getApiEndpoint = (currencyId: string) =>
  isTestnet(currencyId) ? getEnv("APTOS_TESTNET_API_ENDPOINT") : getEnv("APTOS_API_ENDPOINT");
const getIndexerEndpoint = (currencyId: string) =>
  isTestnet(currencyId)
    ? getEnv("APTOS_TESTNET_INDEXER_ENDPOINT")
    : getEnv("APTOS_INDEXER_ENDPOINT");
const getNetwork = (currencyId: string) =>
  isTestnet(currencyId) ? Network.TESTNET : Network.MAINNET;

export class AptosAPI {
  private readonly aptosConfig: AptosConfig;
  private readonly aptosClient: Aptos;

  readonly apolloClient: ApolloClient<object>;

  constructor(currencyIdOrSettings: AptosSettings | string) {
    const appVersion = getEnv("LEDGER_CLIENT_VERSION");

    if (typeof currencyIdOrSettings === "string") {
      this.aptosConfig = new AptosConfig({
        network: getNetwork(currencyIdOrSettings),
        fullnode: getApiEndpoint(currencyIdOrSettings),
        indexer: getIndexerEndpoint(currencyIdOrSettings),
        clientConfig: {
          HEADERS: {
            "X-Ledger-Client-Version": appVersion,
          },
        },
      });
    } else {
      // Ensure the header is present when custom settings are provided
      const settings = { ...currencyIdOrSettings };
      const existingHeaders = settings.clientConfig?.HEADERS ?? {};

      settings.clientConfig = {
        ...(settings.clientConfig ?? {}),
        HEADERS: {
          ...existingHeaders,
          // don’t override if caller already provided it
          "X-Ledger-Client-Version": existingHeaders["X-Ledger-Client-Version"] ?? appVersion,
        },
      };

      this.aptosConfig = new AptosConfig(settings);
    }

    this.aptosClient = new Aptos(this.aptosConfig);
    this.apolloClient = new ApolloClient({
      uri: this.aptosConfig.indexer ?? "",
      cache: new InMemoryCache(),
      headers: {
        "X-Ledger-Client-Version": appVersion,
      },
    });
  }

  async getAccount(address: string): Promise<AccountData> {
    return this.aptosClient.getAccountInfo({ accountAddress: address });
  }

  async getAccountInfo(address: string, startAt?: string) {
    const [balance, transactions, blockHeight] = await Promise.all([
      this.getBalances(address, APTOS_ASSET_ID),
      this.fetchTransactions(address, startAt),
      this.getHeight(),
    ]);
    return {
      balance: balance[0]?.amount ?? BigNumber(0),
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

  async getLastBlock(): Promise<BlockInfo> {
    const { block_height } = await this.aptosClient.getLedgerInfo();
    const block = await this.aptosClient.getBlockByHeight({ blockHeight: Number(block_height) });
    return {
      height: Number(block.block_height),
      hash: block.block_hash,
      time: new Date(Number(block.block_timestamp) / 1_000),
    };
  }

  async estimateFees(transactionIntent: TransactionIntent): Promise<FeeEstimation> {
    const publicKeyEd = new Ed25519PublicKey(transactionIntent?.senderPublicKey ?? "");

    const txPayload: InputEntryFunctionData = {
      function: "0x1::aptos_account::transfer_coins",
      typeArguments: [APTOS_ASSET_ID],
      functionArguments: [transactionIntent.recipient, transactionIntent.amount],
    };

    // TODO: this should be looked over again, might be more precise in terms of types..
    if (transactionIntent.asset.type !== "native") {
      const { type } = transactionIntent.asset;

      if (type === TOKEN_TYPE.FUNGIBLE_ASSET) {
        txPayload.function = "0x1::primary_fungible_store::transfer";
        txPayload.typeArguments = ["0x1::fungible_asset::Metadata"];
        txPayload.functionArguments = [
          transactionIntent.asset.assetReference,
          transactionIntent.recipient,
          transactionIntent.amount,
        ];
      } else if (type === TOKEN_TYPE.COIN) {
        txPayload.function = "0x1::aptos_account::transfer_coins";
        txPayload.typeArguments = [transactionIntent.asset.assetReference as string];
      }
    }

    const txOptions: TransactionOptions = {
      maxGasAmount: DEFAULT_GAS.toString(),
      gasUnitPrice: DEFAULT_GAS_PRICE.toString(),
    };

    const tx = await this.generateTransaction(transactionIntent.sender, txPayload, txOptions);

    const simulation = await this.simulateTransaction(publicKeyEd, tx);
    const completedTx = simulation[0];

    const gasLimit = new BigNumber(completedTx.gas_used)
      .multipliedBy(ESTIMATE_GAS_MUL)
      .integerValue();
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

  async getNextUnlockTime(stakingPoolAddress: string): Promise<string | undefined> {
    const resourceType: MoveStructId = "0x1::stake::StakePool";
    try {
      const resource = await this.aptosClient.getAccountResource<StakePoolResource>({
        accountAddress: stakingPoolAddress,
        resourceType,
      });
      return resource.locked_until_secs;
    } catch (error) {
      log("error", "Failed to fetch StakePool resource:", { error });
    }
  }

  async getDelegatorBalanceInPool(
    poolAddress: string,
    delegatorAddress: string,
  ): Promise<Array<string>> {
    try {
      // Query the delegator balance in the pool
      return await this.aptosClient.view<[string]>({
        payload: {
          function: "0x1::delegation_pool::get_stake",
          typeArguments: [],
          functionArguments: [poolAddress, delegatorAddress],
        },
      });
    } catch (error) {
      log("error", "Failed to fetch delegation_pool::get_stake", { error });
      return ["0", "0", "0"];
    }
  }

  async listOperations(rawAddress: string, minHeight: number): Promise<Page<Operation>> {
    const address = normalizeAddress(rawAddress);
    const transactions = await this.getAccountInfo(address, minHeight.toString());
    const newOperations = transactionsToOperations(address, transactions.transactions);

    return { items: newOperations, next: undefined };
  }

  private async getAllTransactions(address: string, gt?: string): Promise<TransactionVersion[]> {
    let allTransactions: TransactionVersion[] = [];
    let offset = 0;

    let query = GetAccountTransactionsData;
    if (gt) {
      query = GetAccountTransactionsDataGt;
    }

    const condition = true;

    while (condition) {
      try {
        const queryResponse = await this.apolloClient.query<
          GetAccountTransactionsDataQuery,
          GetAccountTransactionsDataGtQueryVariables
        >({
          query,
          variables: {
            address,
            limit: 100,
            gt,
            offset,
          },
          fetchPolicy: "network-only",
        });
        offset += 100;

        allTransactions = allTransactions.concat(queryResponse.data.account_transactions);

        if (queryResponse.data.account_transactions.length < 100) {
          break;
        }
      } catch (error: any) {
        throw new Error(error);
      }
    }

    return allTransactions;
  }

  private async fetchTransactions(address: string, gt?: string) {
    if (!address) {
      return [];
    }

    const transactions = await this.getAllTransactions(address, gt);
    return Promise.all(
      transactions
        .slice()
        .sort((a, b) => b.transaction_version - a.transaction_version)
        .map(({ transaction_version }) => {
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

  async getBalances(address: string, contractAddress?: string): Promise<AptosBalance[]> {
    try {
      const whereCondition: any = {
        owner_address: { _eq: address },
      };

      if (contractAddress !== undefined && contractAddress !== "") {
        whereCondition.asset_type = { _eq: contractAddress };
      }

      const response = await this.aptosClient.getCurrentFungibleAssetBalances({
        options: {
          where: whereCondition,
        },
      });

      return response.map(x => ({
        contractAddress: x.asset_type ?? "",
        amount: BigNumber(x.amount),
      }));
    } catch (error) {
      log("error", "getCoinBalance", {
        error,
      });
      return [{ amount: BigNumber(0), contractAddress: "" }];
    }
  }
}
