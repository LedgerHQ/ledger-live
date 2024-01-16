import { AptosClient, TxnBuilderTypes } from "aptos";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import type { Types as AptosTypes } from "aptos";
import BigNumber from "bignumber.js";
import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";

import {
  GetAccountTransactionsDataQuery,
  GetAccountTransactionsDataQueryVariables,
  PartitionedDelegatedStakingActivities,
  DelegatedStakingActivity,
  GetDelegatedStakingActivitiesQuery,
  StakePrincipals,
} from "./graphql/types";
import {
  GetAccountTransactionsData,
  GetAccountTransactionsDataGt,
  GetAccountTransactionsDataLt,
  GetDelegatedStakingActivities,
} from "./graphql/queries";

import type {
  AptosResource,
  AptosCoinStoreResource,
  AptosTransaction,
  Transaction,
} from "../types";
import { isUndefined } from "lodash";

// const getApiEndpoint = (_: string) => getEnv("APTOS_API_ENDPOINT");
// const getIndexerEndpoint = (_: string) => getEnv("APTOS_INDEXER_ENDPOINT");
const getApiEndpoint = (_: string) => getEnv("APTOS_TESTNET_API_ENDPOINT");
const getIndexerEndpoint = (_: string) => getEnv("APTOS_TESTNET_INDEXER_ENDPOINT");

export class AptosAPI {
  private apiUrl: string;
  private indexerUrl: string;
  private aptosClient: AptosClient;
  private apolloClient: ApolloClient<object>;

  constructor(currencyId: string) {
    this.apiUrl = getApiEndpoint(currencyId);
    this.indexerUrl = getIndexerEndpoint(currencyId);
    this.aptosClient = new AptosClient(this.apiUrl);
    this.apolloClient = new ApolloClient({
      uri: this.indexerUrl,
      cache: new InMemoryCache(),
      headers: {
        "x-client": "ledger-live",
      },
    });
  }

  async fetchTransactions(address: string, lt?: string, gt?: string) {
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

  async richItemByVersion(version: number): Promise<AptosTransaction | null> {
    try {
      const tx: AptosTypes.Transaction = await this.aptosClient.getTransactionByVersion(version);
      const block = await this.getBlock(version);
      return {
        ...tx,
        block,
      } as AptosTransaction;
    } catch (error) {
      return null;
    }
  }

  async getAccount(address: string): Promise<AptosTypes.AccountData> {
    return this.aptosClient.getAccount(address);
  }

  async getAccountInfo(address: string, startAt: string) {
    const [balance, transactions, blockHeight, delegatedBalance] = await Promise.all([
      this.getBalance(address),
      this.fetchTransactions(address, undefined, startAt),
      this.getHeight(),
      this.getTotalStakedAmount(address),
    ]);

    return {
      balance,
      transactions,
      blockHeight,
      delegatedBalance,
    };
  }

  async estimateGasPrice(): Promise<AptosTypes.GasEstimation> {
    return this.aptosClient.estimateGasPrice();
  }

  async generateTransaction(
    address: string,
    payload: AptosTypes.EntryFunctionPayload,
    options: Transaction["options"],
  ): Promise<TxnBuilderTypes.RawTransaction> {
    const opts: Partial<AptosTypes.SubmitTransactionRequest> = {};
    if (!isUndefined(options.maxGasAmount)) {
      opts.max_gas_amount = BigNumber(options.maxGasAmount).toString();
    }

    if (!isUndefined(options.gasUnitPrice)) {
      opts.gas_unit_price = BigNumber(options.gasUnitPrice).toString();
    }

    if (!isUndefined(options.sequenceNumber)) {
      opts.sequence_number = BigNumber(options.sequenceNumber).toString();
    }

    if (!isUndefined(options.expirationTimestampSecs)) {
      opts.expiration_timestamp_secs = BigNumber(options.expirationTimestampSecs).toString();
    }

    const tx = await this.aptosClient.generateTransaction(address, payload, opts);

    let serverTimestamp = tx.expiration_timestamp_secs;
    if (isUndefined(opts.expiration_timestamp_secs)) {
      try {
        const ts = (await this.aptosClient.getLedgerInfo()).ledger_timestamp;
        serverTimestamp = BigInt(Math.ceil(+ts / 1_000_000 + 2 * 60)); // in microseconds
      } catch (e) {
        // nothing
      }
    }

    const ntx = new TxnBuilderTypes.RawTransaction(
      tx.sender,
      tx.sequence_number,
      tx.payload,
      tx.max_gas_amount,
      tx.gas_unit_price,
      serverTimestamp,
      tx.chain_id,
    );

    return ntx;
  }

  async simulateTransaction(
    address: TxnBuilderTypes.Ed25519PublicKey,
    tx: TxnBuilderTypes.RawTransaction,
    options = {
      estimateGasUnitPrice: true,
      estimateMaxGasAmount: true,
      estimatePrioritizedGasUnitPrice: false,
    },
  ): Promise<AptosTypes.UserTransaction[]> {
    return this.aptosClient.simulateTransaction(address, tx, options);
  }

  async broadcast(signature: string): Promise<string> {
    const txBytes = Uint8Array.from(Buffer.from(signature, "hex"));
    const pendingTx = await this.aptosClient.submitTransaction(txBytes);
    return pendingTx.hash;
  }

  private async getBalance(address: string): Promise<BigNumber> {
    try {
      const balanceRes = await this.aptosClient.getAccountResource(
        address,
        "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
      );
      const balance = (balanceRes as AptosResource<AptosCoinStoreResource>).data.coin.value;
      return new BigNumber(balance);
    } catch (e: any) {
      return new BigNumber(0);
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
    const block = await this.aptosClient.getBlockByVersion(version);
    return {
      height: parseInt(block.block_height),
      hash: block.block_hash,
    };
  }

  private async getDelegatedStakingActivitiesForAllPools(
    delegatorAddress: string,
  ): Promise<PartitionedDelegatedStakingActivities> {
    const response = await this.apolloClient.query<GetDelegatedStakingActivitiesQuery>({
      query: GetDelegatedStakingActivities,
      variables: { delegatorAddress },
    });

    const data = response.data;
    return data.delegated_staking_activities.reduce(
      (acc: PartitionedDelegatedStakingActivities, item) => {
        acc[item.pool_address] = acc[item.pool_address] || [];
        acc[item.pool_address].push(item);
        return acc;
      },
      {},
    );
  }

  // https://github.com/aptos-labs/explorer/blob/5c9854e9f3ff97b6c1dcf07c930e53ffead6cedc/src/pages/DelegatoryValidator/utils.tsx#L64
  private getStakeOperationPrincipals(activities: DelegatedStakingActivity[]): StakePrincipals {
    let activePrincipals = 0;
    let pendingInactivePrincipals = 0;

    const activitiesCopy: DelegatedStakingActivity[] = JSON.parse(JSON.stringify(activities));

    activitiesCopy
      .sort((a, b) => Number(a.transaction_version) - Number(b.transaction_version))
      .map((activity: DelegatedStakingActivity) => {
        const eventType = activity.event_type.split("::")[2];
        const amount = activity.amount;
        switch (eventType) {
          case "AddStakeEvent":
            activePrincipals += amount;
            break;
          case "UnlockStakeEvent":
            activePrincipals -= amount;
            pendingInactivePrincipals += amount;
            break;
          case "ReactivateStakeEvent":
            activePrincipals += amount;
            pendingInactivePrincipals -= amount;
            break;
          case "WithdrawStakeEvent":
            pendingInactivePrincipals -= amount;
            break;
        }
        activePrincipals = activePrincipals < 0 ? 0 : activePrincipals;
        pendingInactivePrincipals = pendingInactivePrincipals < 0 ? 0 : pendingInactivePrincipals;
      });

    return { activePrincipals, pendingInactivePrincipals };
  }

  async getTotalStakedAmount(delegatorAddress: string): Promise<BigNumber> {
    const partitionedData = await this.getDelegatedStakingActivitiesForAllPools(delegatorAddress);

    const stakedBalance = Object.values(partitionedData).reduce((total, activities) => {
      const { activePrincipals, pendingInactivePrincipals } =
        this.getStakeOperationPrincipals(activities);
      return total + activePrincipals + pendingInactivePrincipals;
    }, 0);

    return new BigNumber(stakedBalance / 1e8);
  }
}
