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
  MoveStructId,
} from "@aptos-labs/ts-sdk";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import BigNumber from "bignumber.js";
import isUndefined from "lodash/isUndefined";
import { APTOS_ASSET_ID } from "../constants";
import { isTestnet } from "../bridge/logic";
import type { AptosTransaction, TransactionOptions } from "../types";
import { GetAccountTransactionsData, GetAccountTransactionsDataGt } from "./graphql/queries";
import {
  GetAccountTransactionsDataQuery,
  GetAccountTransactionsDataGtQueryVariables,
} from "./graphql/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { GetCurrentDelegatorBalancesData } from "../api/graphql/queries";
import { CurrentDelegatorBalance, GetCurrentDelegatorBalancesQuery } from "../api/graphql/types";

const getApiEndpoint = (currencyId: string) =>
  isTestnet(currencyId) ? getEnv("APTOS_TESTNET_API_ENDPOINT") : getEnv("APTOS_API_ENDPOINT");
const getIndexerEndpoint = (currencyId: string) =>
  isTestnet(currencyId)
    ? getEnv("APTOS_TESTNET_INDEXER_ENDPOINT")
    : getEnv("APTOS_INDEXER_ENDPOINT");

interface StakePoolResource {
  locked_until_secs: string;
  // Add other fields as needed
}

export class AptosAPI {
  private apiUrl: string;
  private indexerUrl: string;
  private aptosConfig: AptosConfig;
  private aptosClient: Aptos;
  public apolloClient: ApolloClient<object>;

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

  async getValidators() {
    const querySecond = GetCurrentDelegatorBalancesData;
    const queryResponseSecond = await this.apolloClient.query<
      GetCurrentDelegatorBalancesQuery,
      object
    >({
      query: querySecond,
      fetchPolicy: "network-only",
    });
    const stakingData: CurrentDelegatorBalance[] =
      queryResponseSecond.data.current_delegator_balances;

    return stakingData;
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

  async getBalance(address: string, token: TokenCurrency): Promise<BigNumber> {
    let balance = new BigNumber(0);
    if (token.tokenType === "coin") {
      balance = await this.getCoinBalance(address, token.contractAddress);
    } else {
      balance = await this.getFABalance(address, token.contractAddress);
    }
    return balance;
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
    } catch (_) {
      return new BigNumber(0);
    }
  }

  async getNextUnlockTime(stakingPoolAddress: string): Promise<string | undefined> {
    const resourceType: MoveStructId = "0x1::stake::StakePool";
    try {
      const resource = await this.aptosClient.getAccountResource({
        accountAddress: stakingPoolAddress,
        resourceType,
      });
      const data = resource as StakePoolResource;
      if (data && data.locked_until_secs) {
        return data.locked_until_secs;
      }
    } catch (error) {
      console.error("Failed to fetch StakePool resource:", error);
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
    } catch (_) {
      return new BigNumber(0);
    }
  }

  async getDelegatorBalanceInPool(poolAddress: string, delegatorAddress: string): Promise<any> {
    try {
      // Query the delegator balance in the pool
      return await this.aptosClient.view<[string]>({
        payload: {
          function: "0x1::delegation_pool::get_stake",
          typeArguments: [],
          functionArguments: [poolAddress, delegatorAddress],
        },
      });
    } catch (_) {
      return [0, 0, 0];
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
      return null;
    }
  }

  private async getHeight(): Promise<number> {
    const { data } = await network<Block>({
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
