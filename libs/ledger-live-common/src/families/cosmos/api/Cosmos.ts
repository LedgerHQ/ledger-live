import { getEnv } from "../../../env";
import BigNumber from "bignumber.js";
import network from "../../../network";
import { CryptoCurrency, Operation } from "../../../types";
import { patchOperationWithHash } from "../../../operation";

const defaultEndpoint = getEnv(
  "API_COSMOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT"
).replace(/\/$/, "");

export const getAccountInfo = async (
  address: string,
  currency: CryptoCurrency
): Promise<any> => {
  try {
    const [
      { accountNumber, sequence },
      balances,
      blockHeight,
      txs,
      delegations,
      redelegations,
      unbondings,
      withdrawAddress,
    ] = await Promise.all([
      getAccount(address),
      getAllBalances(address, currency),
      getHeight(),
      getTransactions(address),
      getDelegations(address, currency),
      getRedelegations(address),
      getUnbondings(address),
      getWithdrawAddress(address),
    ]);

    return {
      balances,
      blockHeight,
      txs,
      delegations,
      redelegations,
      unbondings,
      withdrawAddress,
      accountNumber,
      sequence,
    };
  } catch (e: any) {
    throw new Error(`"Error during cosmos synchronization: "${e.message}`);
  }
};

export const getAccount = async (
  address: string
): Promise<{ address: string; accountNumber: number; sequence: number }> => {
  const response = {
    address: address,
    accountNumber: 0,
    sequence: 0,
  };

  try {
    const { data } = await network({
      method: "GET",
      url: `${defaultEndpoint}/cosmos/auth/v1beta1/accounts/${address}`,
    });

    if (data.account.address) {
      response.address = data.account.address;
    }

    if (data.account.account_number) {
      response.accountNumber = parseInt(data.account.account_number);
    }

    if (data.account.sequence) {
      response.sequence = parseInt(data.account.sequence);
    }
    // eslint-disable-next-line no-empty
  } catch (e) {}
  return response;
};

export const getChainId = async (): Promise<string> => {
  const { data } = await network({
    method: "GET",
    url: `${defaultEndpoint}/node_info`,
  });

  return data.node_info.network;
};

const getHeight = async (): Promise<number> => {
  const { data } = await network({
    method: "GET",
    url: `${defaultEndpoint}/cosmos/base/tendermint/v1beta1/blocks/latest`,
  });

  return data.block.header.height;
};

const getAllBalances = async (
  address: string,
  currency: CryptoCurrency
): Promise<BigNumber> => {
  const { data } = await network({
    method: "GET",
    url: `${defaultEndpoint}/cosmos/bank/v1beta1/balances/${address}`,
  });

  let amount = new BigNumber(0);

  for (const elem of data.balances) {
    if (elem.denom === currency.units[1].code)
      amount = amount.plus(elem.amount);
  }

  return amount;
};

const getDelegations = async (
  address: string,
  currency: CryptoCurrency
): Promise<any> => {
  const delegations: Array<any> = [];

  const { data: data1 } = await network({
    method: "GET",
    url: `${defaultEndpoint}/cosmos/staking/v1beta1/delegations/${address}`,
  });

  let status = "unbonded";
  const statusMap = {
    BOND_STATUS_UNBONDED: "unbonded",
    BOND_STATUS_UNBONDING: "unbonding",
    BOND_STATUS_BONDED: "bonded",
  };

  for (const d of data1.delegation_responses) {
    const { data: data2 } = await network({
      method: "GET",
      url: `${defaultEndpoint}/cosmos/staking/v1beta1/validators/${d.delegation.validator_address}`,
    });

    status = statusMap[data2.validator.status] || "unbonded";

    delegations.push({
      validatorAddress: d.delegation.validator_address,
      amount:
        d.balance.denom === currency.units[1].code
          ? new BigNumber(d.balance.amount)
          : new BigNumber(0),
      pendingRewards: new BigNumber(0),
      status,
    });
  }

  const { data: data3 } = await network({
    method: "GET",
    url: `${defaultEndpoint}/cosmos/distribution/v1beta1/delegators/${address}/rewards`,
  });

  for (const r of data3.rewards) {
    for (const d of delegations) {
      if (r.validator_address === d.validatorAddress) {
        for (const reward of r.reward) {
          d.pendingRewards = d.pendingRewards.plus(
            new BigNumber(reward.amount).integerValue()
          );
        }
      }
    }
  }

  return delegations;
};

const getRedelegations = async (address: string): Promise<any> => {
  const redelegations: Array<any> = [];

  const { data } = await network({
    method: "GET",
    url: `${defaultEndpoint}/cosmos/staking/v1beta1/delegators/${address}/redelegations`,
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

const getUnbondings = async (address: string): Promise<any> => {
  const unbondings: Array<any> = [];

  const { data } = await network({
    method: "GET",
    url: `${defaultEndpoint}/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`,
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

const getWithdrawAddress = async (address: string): Promise<string> => {
  const { data } = await network({
    method: "GET",
    url: `${defaultEndpoint}/cosmos/distribution/v1beta1/delegators/${address}/withdraw_address`,
  });

  return data.withdraw_address;
};

const getTransactions = async (address: string): Promise<any> => {
  const receive = await network({
    method: "GET",
    url:
      `${defaultEndpoint}/cosmos/tx/v1beta1/txs?events=` +
      encodeURI(`transfer.recipient='${address}'`),
  });

  const send = await network({
    method: "GET",
    url:
      `${defaultEndpoint}/cosmos/tx/v1beta1/txs?events=` +
      encodeURI(`message.sender='${address}'`),
  });

  return [...receive.data.tx_responses, ...send.data.tx_responses];
};

export const isValidRecipent = async (address: string): Promise<boolean> => {
  try {
    await network({
      method: "GET",
      url: `${defaultEndpoint}/cosmos/bank/v1beta1/balances/${address}`,
    });

    return true;
  } catch (e) {
    return false;
  }
};

export const simulate = async (tx_bytes: Array<any>): Promise<BigNumber> => {
  try {
    const { data } = await network({
      method: "POST",
      url: `${defaultEndpoint}/cosmos/tx/v1beta1/simulate`,
      data: {
        tx_bytes: tx_bytes,
      },
    });

    return new BigNumber(data?.gas_info?.gas_used || 0);
  } catch (e) {
    return new BigNumber(0);
  }
};

export const broadcast = async ({
  signedOperation: { operation, signature },
}): Promise<Operation> => {
  const { data } = await network({
    method: "POST",
    url: `${defaultEndpoint}/cosmos/tx/v1beta1/txs`,
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
        "')"
    );
  }

  return patchOperationWithHash(operation, data.tx_response.txhash);
};
