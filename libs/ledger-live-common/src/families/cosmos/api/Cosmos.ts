import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { patchOperationWithHash } from "../../../operation";
import cryptoFactory from "../chain/chain";
import cosmosBase from "../chain/cosmosBase";
import {
  CosmosDelegation,
  CosmosDelegationStatus,
  CosmosRedelegation,
  CosmosTx,
  CosmosUnbonding,
} from "../types";

export class CosmosAPI {
  protected defaultEndpoint: string;
  private version: string;
  private chainInstance: cosmosBase;

  constructor(currencyId: string) {
    const crypto = cryptoFactory(currencyId);
    this.chainInstance = crypto;
    this.defaultEndpoint = crypto.lcd;
    this.version = crypto.version;
  }

  getAccountInfo = async (
    address: string,
    currency: CryptoCurrency,
  ): Promise<{
    balances: BigNumber;
    blockHeight: number;
    txs: CosmosTx[];
    delegations: CosmosDelegation[];
    redelegations: CosmosRedelegation[];
    unbondings: CosmosUnbonding[];
    withdrawAddress: string;
    accountInfo: { sequence: number; accountNumber: number };
  }> => {
    try {
      const [
        accountInfo,
        balances,
        blockHeight,
        txs,
        delegations,
        redelegations,
        unbondings,
        withdrawAddress,
      ] = await Promise.all([
        this.getAccount(address, this.chainInstance.defaultPubKeyType),
        this.getAllBalances(address, currency),
        this.getHeight(),
        this.getTransactions(address, 100),
        this.getDelegations(address, currency),
        this.getRedelegations(address),
        this.getUnbondings(address),
        this.getWithdrawAddress(address),
      ]);

      return {
        accountInfo,
        balances,
        blockHeight,
        txs,
        delegations,
        redelegations,
        unbondings,
        withdrawAddress,
      };
    } catch (e) {
      throw new Error(`"Error during cosmos synchronization: "${(e as Error).message}`);
    }
  };

  getAccount = async (
    address: string,
    defaultPubKeyType: string,
  ): Promise<{ accountNumber: number; sequence: number; pubKeyType: string; pubKey: string }> => {
    const accountData = {
      accountNumber: 0,
      sequence: 0,
      pubKeyType: defaultPubKeyType,
      pubKey: "",
    };

    try {
      const { data } = await network({
        method: "GET",
        url: `${this.defaultEndpoint}/cosmos/auth/${this.version}/accounts/${address}`,
      });

      // We use base_account for Ethermint chains and account for the rest
      const srcAccount = data.account.base_account || data.account;

      if (srcAccount.account_number) {
        accountData.accountNumber = parseInt(srcAccount.account_number);
      }

      if (srcAccount.sequence) {
        accountData.sequence = parseInt(srcAccount.sequence);
      }

      if (srcAccount.pub_key) {
        accountData.pubKey = srcAccount.pub_key.key;
        accountData.pubKeyType = srcAccount.pub_key["@type"];
      }
    } catch (e) {
      log(
        "debug",
        "Could not fetch account info, account might have never been used, using default values instead",
        { e },
      );
    }

    return accountData;
  };

  getChainId = async (): Promise<string> => {
    const { data } = await network({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/base/tendermint/${this.version}/node_info`,
    });

    return data.default_node_info.network;
  };

  getHeight = async (): Promise<number> => {
    const { data } = await network({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/base/tendermint/${this.version}/blocks/latest`,
    });

    return parseInt(data.block.header.height);
  };

  getAllBalances = async (address: string, currency: CryptoCurrency): Promise<BigNumber> => {
    const { data } = await network({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/bank/${this.version}/balances/${address}`,
    });

    let amount = new BigNumber(0);

    for (const elem of data.balances) {
      if (elem.denom === currency.units[1].code) amount = amount.plus(elem.amount);
    }

    return amount;
  };

  getDelegations = async (
    address: string,
    currency: CryptoCurrency,
  ): Promise<CosmosDelegation[]> => {
    const delegations: Array<CosmosDelegation> = [];

    const { data: data1 } = await network({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/staking/${this.version}/delegations/${address}`,
    });

    data1.delegation_responses = data1.delegation_responses.filter(d => d.balance.amount !== "0");

    let status = "unbonded";
    const statusMap = {
      BOND_STATUS_UNBONDED: "unbonded",
      BOND_STATUS_UNBONDING: "unbonding",
      BOND_STATUS_BONDED: "bonded",
    };

    for (const d of data1.delegation_responses) {
      const { data: data2 } = await network({
        method: "GET",
        url: `${this.defaultEndpoint}/cosmos/staking/${this.version}/validators/${d.delegation.validator_address}`,
      });

      status = statusMap[data2.validator.status] || "unbonded";

      delegations.push({
        validatorAddress: d.delegation.validator_address,
        amount:
          d.balance.denom === currency.units[1].code
            ? new BigNumber(d.balance.amount)
            : new BigNumber(0),
        pendingRewards: new BigNumber(0),
        status: status as CosmosDelegationStatus,
      });
    }

    const { data: data3 } = await network({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/distribution/${this.version}/delegators/${address}/rewards`,
    });

    for (const r of data3.rewards) {
      for (const d of delegations) {
        if (r.validator_address === d.validatorAddress) {
          for (const reward of r.reward) {
            if (reward.denom === currency.units[1].code)
              d.pendingRewards = d.pendingRewards.plus(
                new BigNumber(reward.amount).integerValue(BigNumber.ROUND_CEIL),
              );
          }
        }
      }
    }

    return delegations;
  };

  getRedelegations = async (address: string): Promise<CosmosRedelegation[]> => {
    const redelegations: Array<CosmosRedelegation> = [];

    const { data } = await network({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/staking/${this.version}/delegators/${address}/redelegations`,
    });

    for (const r of data.redelegation_responses) {
      for (const entry of r.entries) {
        redelegations.push({
          validatorSrcAddress: r.redelegation.validator_src_address,
          validatorDstAddress: r.redelegation.validator_dst_address,
          amount: new BigNumber(entry.redelegation_entry.initial_balance),
          completionDate: new Date(entry.redelegation_entry.completion_time),
        });
      }
    }

    return redelegations;
  };

  getUnbondings = async (address: string): Promise<CosmosUnbonding[]> => {
    const unbondings: Array<CosmosUnbonding> = [];

    const { data } = await network({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/staking/${this.version}/delegators/${address}/unbonding_delegations`,
    });

    for (const u of data.unbonding_responses) {
      for (const entry of u.entries) {
        unbondings.push({
          validatorAddress: u.validator_address,
          amount: new BigNumber(entry.initial_balance),
          completionDate: new Date(entry.completion_time),
        });
      }
    }

    return unbondings;
  };

  getWithdrawAddress = async (address: string): Promise<string> => {
    const { data } = await network({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/distribution/${this.version}/delegators/${address}/withdraw_address`,
    });

    return data.withdraw_address;
  };

  getTransactions = async (address: string, paginationSize: number): Promise<CosmosTx[]> => {
    const senderTxs = await this.fetchAllTransactions(address, "message.sender", paginationSize);
    const recipientTxs = await this.fetchAllTransactions(
      address,
      "transfer.recipient",
      paginationSize,
    );

    return [...senderTxs, ...recipientTxs];
  };

  private async fetchAllTransactions(
    address: string,
    filterOn: "message.sender" | "transfer.recipient",
    paginationSize: number,
  ) {
    let txs: CosmosTx[] = [];
    try {
      let total: number;
      let previousTxCall: CosmosTx[] | null = null;
      let paginationOffset = 0;

      do {
        const response: {
          txs: CosmosTx[];
          nextPageToken: string | undefined;
          total: number;
        } = await this.fetchTransactions(this.defaultEndpoint, filterOn, address, {
          "pagination.limit": paginationSize,
          "pagination.offset": paginationOffset,
          "pagination.reverse": true,
        });

        if (
          previousTxCall &&
          previousTxCall.length === txs.length &&
          response.txs[0] &&
          previousTxCall[0].txhash === response.txs[0].txhash
        ) {
          // Means we are getting the same thing... prevents an infinite loop
          break;
        }

        paginationOffset += paginationSize;
        total = response.total;
        previousTxCall = response.txs;
        txs = [...txs, ...response.txs];
      } while (txs.length < total);
      // The right condition should be nextPageToken != null but next_key isn't returned by the node for some reason
    } catch (e) {
      // Tx fetching failed, we return an empty array
      return [];
    }
    return txs;
  }

  private async fetchTransactions(
    nodeUrl: string,
    filterOn: "message.sender" | "transfer.recipient",
    address: string,
    options: {
      "pagination.limit"?: number;
      "pagination.offset"?: number;
      "pagination.reverse"?: boolean;
    },
  ): Promise<{
    txs: CosmosTx[];
    nextPageToken: string | undefined;
    total: number;
  }> {
    let serializedOptions = "";
    for (const key of Object.keys(options)) {
      serializedOptions += options[key] != null ? `&${key}=${options[key]}` : "";
    }
    const response: {
      data: {
        tx_responses: CosmosTx[];
        pagination: { total: number; next_key: string | undefined };
      };
    } = await network({
      method: "GET",
      url:
        `${nodeUrl}/cosmos/tx/${this.version}/txs?events=` +
        encodeURI(`${filterOn}='${address}'`) +
        serializedOptions,
    });

    return {
      txs: response.data.tx_responses,
      nextPageToken: response.data.pagination.next_key,
      total: response.data.pagination.total,
    };
  }

  broadcast = async ({ signedOperation: { operation, signature } }): Promise<Operation> => {
    const { data } = await network({
      method: "POST",
      url: `${this.defaultEndpoint}/cosmos/tx/${this.version}/txs`,
      data: {
        tx_bytes: Array.from(Uint8Array.from(Buffer.from(signature, "hex"))),
        mode: "BROADCAST_MODE_SYNC",
      },
    });

    if (data.tx_response.code != 0) {
      // error codes: https://github.com/cosmos/cosmos-sdk/blob/master/types/errors/errors.go
      throw new Error(
        "invalid broadcast return (code: " +
          (data.tx_response.code || "?") +
          ", message: '" +
          (data.tx_response.raw_log || "") +
          "')",
      );
    }

    return patchOperationWithHash(operation, data.tx_response.txhash);
  };

  /** Simulate a transaction on the node to get a precise estimation of gas used */
  simulate = async (tx_bytes: number[]): Promise<BigNumber> => {
    try {
      const { data } = await network({
        method: "POST",
        url: `${this.defaultEndpoint}/cosmos/tx/${this.version}/simulate`,
        data: {
          tx_bytes,
        },
      });

      if (data && data.gas_info && data.gas_info.gas_used) {
        return new BigNumber(data.gas_info.gas_used);
      } else {
        throw new Error("No gas used returned from lcd");
      }
    } catch (e) {
      throw new Error("Tx simulation failed");
    }
  };
}
