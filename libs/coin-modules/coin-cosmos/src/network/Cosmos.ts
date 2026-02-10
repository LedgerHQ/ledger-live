import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { SequenceNumberError } from "@ledgerhq/errors";
import { EnvName, EnvValue } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation, SignedOperation } from "@ledgerhq/types-live";
import { AxiosError } from "axios";
import BigNumber from "bignumber.js";
import semver from "semver";
import cryptoFactory from "../chain/chain";
import cosmosBase from "../chain/cosmosBase";
import {
  CosmosDelegation,
  CosmosDelegationStatus,
  CosmosRedelegation,
  CosmosTx,
  CosmosUnbonding,
  CosmosValidatorItem,
} from "../types";
import * as CosmosSDKTypes from "./types";
import { GetValidatorItem } from "./types";

const USDC_DENOM = "ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5";

export class CosmosAPI {
  protected defaultEndpoint: string;
  private version: string;
  private chainInstance: cosmosBase;
  private _cosmosSDKVersion: Promise<string> | null = null;
  private get cosmosSDKVersion(): Promise<string> {
    if (!this._cosmosSDKVersion) {
      this._cosmosSDKVersion = this.getCosmosSDKVersion();
    }
    return this._cosmosSDKVersion;
  }

  constructor(
    currencyId: string,
    options?: { endpoint: EnvValue<EnvName> | undefined; version: string },
  ) {
    const crypto = cryptoFactory(currencyId);
    this.chainInstance = crypto;
    this.defaultEndpoint = options?.endpoint?.toString() ?? crypto.lcd;
    this.version = options?.version ?? crypto.version;
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
        this.getAccount(address),
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
      const error = e as AxiosError;
      if (error.isAxiosError) {
        throw new Error(
          `Error during ${currency.id} synchronization: ${JSON.stringify(error.toJSON())}`,
        );
      } else {
        throw new Error(`Error during ${currency.id} synchronization: ${error.message}`);
      }
    }
  };

  private getCosmosSDKVersion = async (): Promise<string> => {
    const { application_version } = await this.getNodeInfo();
    const cosmosSDKVersion = application_version.cosmos_sdk_version;
    return cosmosSDKVersion;
  };

  /**
   * @sdk https://docs.cosmos.network/api#tag/Query/operation/Pool
   */
  getValidators = async (): Promise<CosmosValidatorItem[]> => {
    const { data } = await network({
      url: `${this.defaultEndpoint}/cosmos/staking/${this.version}/validators?status=BOND_STATUS_BONDED&pagination.limit=200`,
      method: "GET",
    });
    const validators = data.validators.map((validator: GetValidatorItem) => {
      const commission = parseFloat(validator.commission.commission_rates.rate);
      return {
        validatorAddress: validator.operator_address,
        name: validator.description.moniker,
        tokens: parseFloat(validator.tokens),
        votingPower: 0,
        commission,
        estimatedYearlyRewardsRate: 0,
      };
    });

    return validators;
  };

  /**
   * @sdk https://docs.cosmos.network/api#tag/Query/operation/Account
   * @warning return is technically "any" based on documentation and may differ depending on the chain
   */
  getAccount = async (
    address: string,
  ): Promise<{ accountNumber: number; sequence: number; pubKeyType: string; pubKey: string }> => {
    const accountData = {
      accountNumber: 0,
      sequence: 0,
      pubKeyType: this.chainInstance.defaultPubKeyType,
      pubKey: "",
    };

    try {
      const {
        data: { account },
      } = await network<CosmosSDKTypes.GetAccountDetails>({
        method: "GET",
        url: `${this.defaultEndpoint}/cosmos/auth/${this.version}/accounts/${address}`,
      });

      // We use base_account for Ethermint chains and account for the rest
      const srcAccount =
        account["@type"] === "/cosmos.auth.v1beta1.BaseAccount" ? account : account.base_account;

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

  /**
   * @sdk https://docs.cosmos.network/api#tag/Service/operation/GetNodeInfo
   * @notice returns { application_versoin: { ..., cosmos_sdk_version } } (Since: cosmos-sdk 0.43)
   */
  getNodeInfo = async (): Promise<CosmosSDKTypes.GetNodeInfosSDK> => {
    const data = (
      await network<CosmosSDKTypes.GetNodeInfosSDK>({
        method: "GET",
        url: `${this.defaultEndpoint}/cosmos/base/tendermint/${this.version}/node_info`,
      })
    ).data;
    return data;
  };

  /**
   * @sdk https://docs.cosmos.network/api#tag/Service/operation/GetLatestBlock
   * @warning returns { ..., block } (Deprecated: please use `sdk_block` instead)
   * @notice returns { ..., sdk_block } (Since: cosmos-sdk:0.47)
   */
  getHeight = async (): Promise<number> => {
    const {
      data: { block, sdk_block },
    } = await network<CosmosSDKTypes.GetLatestBlockSDK>({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/base/tendermint/${this.version}/blocks/latest`,
    });

    return sdk_block ? parseInt(sdk_block.header.height) : parseInt(block.header.height);
  };

  /**
   * @sdk https://docs.cosmos.network/api#tag/Query/operation/AllBalances
   * @notice query params { pagination: { ..., reverse } } (Since: cosmos-sdk 0.43)
   * @notice query params { pagination: {..., resolve_denom } } (Since: cosmos-sdk 0.50)
   */
  getAllBalances = async (address: string, currency: CryptoCurrency): Promise<BigNumber> => {
    const {
      data: { balances },
    } = await network<CosmosSDKTypes.GetAllBalancesSDK>({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/bank/${this.version}/balances/${address}`,
    });

    let totalAmount = new BigNumber(0);
    for (const { denom, amount } of balances) {
      if (denom === currency.units[1].code) {
        totalAmount = totalAmount.plus(amount);
      }
    }

    return totalAmount;
  };

  /**
   * @sdk https://docs.cosmos.network/api#tag/Query/operation/DelegatorDelegations
   * @notice query params { pagination: { ..., reverse } } (Since: cosmos-sdk 0.43)
   * @sdk https://docs.cosmos.network/api#tag/Query/operation/Validator
   * @sdk https://docs.cosmos.network/api#tag/Query/operation/DelegationTotalRewards
   *
   * @warning This call should use a Promise.all on all non dependent requests in order to improve performances
   */
  getDelegations = async (
    address: string,
    currency: CryptoCurrency,
  ): Promise<CosmosDelegation[]> => {
    const delegations: Array<CosmosDelegation> = [];

    const {
      data: { delegation_responses: delegationResponses },
    } = await network<CosmosSDKTypes.GetDelegatorDelegations>({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/staking/${this.version}/delegations/${address}`,
    });

    const filteredDelegationResponses = delegationResponses.filter(
      delegation => delegation.balance.amount !== "0",
    );

    let status = "unbonded";
    const statusMap = {
      BOND_STATUS_UNBONDED: "unbonded",
      BOND_STATUS_UNBONDING: "unbonding",
      BOND_STATUS_BONDED: "bonded",
      BOND_STATUS_UNSPECIFIED: "unspecified",
    };

    for (const { delegation, balance } of filteredDelegationResponses) {
      const {
        data: { validator },
      } = await network<CosmosSDKTypes.GetValidatorSDK>({
        method: "GET",
        url: `${this.defaultEndpoint}/cosmos/staking/${this.version}/validators/${delegation.validator_address}`,
      });

      status = statusMap[validator.status] || "unbonded";

      delegations.push({
        validatorAddress: delegation.validator_address,
        amount:
          balance.denom === currency.units[1].code
            ? new BigNumber(balance.amount)
            : new BigNumber(0),
        pendingRewards: new BigNumber(0),
        status: status as CosmosDelegationStatus,
      });
    }

    const {
      data: { rewards },
    } = await network<CosmosSDKTypes.GetDelegationTotalReward>({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/distribution/${this.version}/delegators/${address}/rewards`,
    });

    // 3 for loops imbricated ? :exploding_head:
    for (const r of rewards) {
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

  /**
   * @sdk https://docs.cosmos.network/api#tag/Query/operation/Redelegations
   * @notice query params { pagination: { ..., reverse } } (Since: cosmos-sdk 0.43)
   */
  getRedelegations = async (address: string): Promise<CosmosRedelegation[]> => {
    const redelegations: Array<CosmosRedelegation> = [];

    const {
      data: { redelegation_responses: redelegationResponses },
    } = await network<CosmosSDKTypes.GetRedelegations>({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/staking/${this.version}/delegators/${address}/redelegations`,
    });

    for (const { entries, redelegation } of redelegationResponses) {
      for (const {
        redelegation_entry: { initial_balance: initalBalance, completion_time: completionTime },
      } of entries) {
        redelegations.push({
          validatorSrcAddress: redelegation.validator_src_address,
          validatorDstAddress: redelegation.validator_dst_address,
          amount: new BigNumber(initalBalance),
          completionDate: new Date(completionTime),
        });
      }
    }

    return redelegations;
  };

  /**
   * @sdk https://docs.cosmos.network/api#tag/Query/operation/ValidatorUnbondingDelegations
   * @notice query params { pagination: { ..., reverse } } (Since: cosmos-sdk 0.43)
   */
  getUnbondings = async (address: string): Promise<CosmosUnbonding[]> => {
    const unbondings: Array<CosmosUnbonding> = [];

    const {
      data: { unbonding_responses: unbondingResponses },
    } = await network<CosmosSDKTypes.GetValidatorUnbondingDelegations>({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/staking/${this.version}/delegators/${address}/unbonding_delegations`,
    });

    for (const { validator_address: validatorAddress, entries } of unbondingResponses) {
      for (const { initial_balance: initialBalance, completion_time: completionTime } of entries) {
        unbondings.push({
          validatorAddress,
          amount: new BigNumber(initialBalance),
          completionDate: new Date(completionTime),
        });
      }
    }

    return unbondings;
  };

  /**
   * @sdk https://docs.cosmos.network/api#tag/Query/operation/DelegatorWithdrawAddress
   */
  getWithdrawAddress = async (address: string): Promise<string> => {
    const {
      data: { withdraw_address: withdrawAddress },
    } = await network<CosmosSDKTypes.GetDelegatorWithdrawAddress>({
      method: "GET",
      url: `${this.defaultEndpoint}/cosmos/distribution/${this.version}/delegators/${address}/withdraw_address`,
    });

    return withdrawAddress;
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
    try {
      let allTxs: CosmosTx[] = [];
      let paginationOffset = 0;
      let maxTxs = 0;

      do {
        const { txs, total } = await this.fetchTransactions(
          this.defaultEndpoint,
          filterOn,
          address,
          {
            "pagination.limit": paginationSize,
            "pagination.offset": paginationOffset,
            "pagination.reverse": true,
          },
        );

        paginationOffset += paginationSize;
        maxTxs = total;
        allTxs = allTxs.concat(txs);
      } while (allTxs.length < maxTxs);

      return allTxs;
    } catch (e) {
      log("debug", "Could not fetch txs", { e });
      // Tx fetching failed, we return an empty array
      return [];
    }
  }

  /**
   * @sdk https://docs.cosmos.network/api#tag/Service/operation/GetTxsEvent
   * @warning query param { ..., events } (Deprecated: post v0.47.x use query instead, which should contain a valid events query)
   * @warning returns { ..., pagination } (Deprecated: post v0.46.x use total instead)
   * @notice returns { ..., total } (Since: cosmos-sdk 0.46.x)
   * @notice query params { ..., query } (Since: cosmos-sdk 0.50)
   * @notice query params { pagination: { ..., reverse } } (Since: cosmos-sdk 0.43)
   */
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
    total: number;
  }> {
    let cosmosSDKVersion = await this.cosmosSDKVersion;
    const coerceResult = semver.coerce(cosmosSDKVersion);
    if (coerceResult !== null) {
      cosmosSDKVersion = coerceResult.version;
    }
    let queryparam = "events";
    if (semver.gte(cosmosSDKVersion, "0.50.0")) {
      queryparam = "query";
    }
    let serializedOptions = "";
    for (const key of Object.keys(options) as Array<keyof typeof options>) {
      serializedOptions += key in options ? `&${key}=${options[key]}` : "";
    }
    const { data } = await network<CosmosSDKTypes.GetTxsEvents>({
      method: "GET",
      url:
        `${nodeUrl}/cosmos/tx/${this.version}/txs?${queryparam}=` +
        encodeURI(`${filterOn}='${address}'`) +
        serializedOptions,
    });

    return {
      txs: data.tx_responses,
      total: "total" in data ? data.total : data.pagination.total,
    };
  }

  /**
   * @sdk https://docs.cosmos.network/api#tag/Service/operation/BroadcastTx
   * @deprecated body {..., mode } -> BROADCAST_MODE_BLOCK (Deprecated: post v0.47 use BROADCAST_MODE_SYNC instead)
   * @notice returns {..., events } (Since: cosmos-sdk 0.42.11, 0.44.5, 0.45)
   */
  broadcast = async ({
    signedOperation: { signature, operation },
  }: {
    signedOperation: SignedOperation;
  }): Promise<Operation> => {
    const {
      data: { tx_response: txResponse },
    } = await network<CosmosSDKTypes.PostBroadcast>({
      method: "POST",
      url: `${this.defaultEndpoint}/cosmos/tx/${this.version}/txs`,
      data: {
        tx_bytes: Array.from(Uint8Array.from(Buffer.from(signature, "hex"))),
        mode: "BROADCAST_MODE_SYNC",
      },
    });

    if (txResponse.code !== 0) {
      // error codes: https://github.com/cosmos/cosmos-sdk/blob/master/types/errors/errors.go
      // Handle cosmos sequence mismatch error(error code 32) because the backend returns a wrong sequence sometimes
      // This is a temporary fix until we have a better backend
      if (txResponse.code === 32) {
        throw new SequenceNumberError();
      }
      throw new Error(
        "invalid broadcast return (code: " +
          (txResponse.code || "?") +
          ", message: '" +
          (txResponse.raw_log || "") +
          "')",
      );
    }

    return patchOperationWithHash(operation, txResponse.txhash);
  };

  /**
   * Simulate a transaction on the node to get a precise estimation of gas used
   * @sdk https://docs.cosmos.network/api#tag/Service/operation/Simulate
   * @notice body {..., tx_bytes } (Since: cosmos-sdk 0.43)
   * @notice returns {..., result: {..., msg_responses } } (Since: cosmos-sdk 0.46)
   */
  simulate = async (tx_bytes: number[]): Promise<BigNumber> => {
    try {
      const {
        data: { gas_info: gasInfo },
      } = await network<CosmosSDKTypes.PostSimulate>({
        method: "POST",
        url: `${this.defaultEndpoint}/cosmos/tx/${this.version}/simulate`,
        data: {
          tx_bytes,
        },
      });

      if (gasInfo.gas_used) {
        return new BigNumber(gasInfo.gas_used);
      } else {
        throw new Error("No gas used returned from lcd");
      }
    } catch {
      throw new Error("Tx simulation failed");
    }
  };

  /**
   * This is a quick and dirty way to get the usdc staking rewards for a given dYdX address
   * This should be cleaned up when the proper ibc token integration is done
   */
  getUsdcRewards = async (address: string): Promise<BigNumber> => {
    try {
      const {
        data: { total },
      } = await network<CosmosSDKTypes.GetDelegationTotalReward>({
        method: "GET",
        url: `${this.defaultEndpoint}/cosmos/distribution/v1beta1/delegators/${address}/rewards`,
      });

      const usdcRewards: CosmosSDKTypes.Balance | undefined = total.find(
        (reward: CosmosSDKTypes.Balance) => reward.denom === USDC_DENOM,
      );

      return new BigNumber(usdcRewards?.amount || "0");
    } catch {
      throw new Error(`Can't fetch usdc rewards for address ${address}`);
    }
  };
}
