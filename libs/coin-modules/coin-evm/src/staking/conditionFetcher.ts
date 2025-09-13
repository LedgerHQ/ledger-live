import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { withApi } from "../network/node/rpc.common";
import type {
  StakingContractConfig,
  StakeConditions,
  StakeData,
  RpcProvider,
  CeloVote,
  CeloPendingWithdrawal,
} from "../types";
import { encodeStakingData, decodeStakingResult } from "./encoder";
import { buildTransactionParams } from "./transactionData";
import { STAKING_CONTRACTS } from "./contracts";
import { calculateStakeConditions } from "./conditions";

/**
 * Fetch stake conditions for a specific validator/stake
 */
export const fetchStakeConditions = async (
  currency: CryptoCurrency,
  address: string,
  validatorAddress: string,
): Promise<StakeConditions> => {
  const config = STAKING_CONTRACTS[currency.id];
  if (!config) {
    throw new Error(`No staking config for currency: ${currency.id}`);
  }

  return withApi(currency, async api => {
    if (currency.id === "celo") {
      return await fetchCeloConditions(api, config, address, validatorAddress);
    }

    if (currency.id === "sei_network_evm") {
      return await fetchSeiConditions(api, config, address, validatorAddress);
    }

    throw new Error(`Unsupported currency: ${currency.id}`);
  });
};

/**
 * Fetch Celo staking
 */
const fetchCeloConditions = async (
  api: RpcProvider,
  config: StakingContractConfig,
  address: string,
  _validatorAddress: string,
): Promise<StakeConditions> => {
  try {
    const balanceParams = buildTransactionParams("celo", "getStakedBalance", {
      recipient: address,
    });
    const balanceData = encodeStakingData({
      currencyId: "celo",
      operation: "getStakedBalance",
      config,
      params: balanceParams,
    });

    const balanceResult = await api.call({
      to: config.contractAddress,
      data: balanceData,
    });

    const balance = decodeStakingResult("celo", "getStakedBalance", config, balanceResult);
    const amount = BigInt(balance[0].toString());

    if (amount === 0n) {
      return { activatable: false, revokable: false, withdrawable: false, status: "none" };
    }

    // get voter info to check for pending votes
    const voterParams = buildTransactionParams("celo", "getVoter", {
      recipient: address,
    });
    const voterData = encodeStakingData({
      currencyId: "celo",
      operation: "getVoter",
      config,
      params: voterParams,
    });

    const voterResult = await api.call({
      to: config.contractAddress,
      data: voterData,
    });

    const voterInfo = decodeStakingResult("celo", "getVoter", config, voterResult);

    let hasPendingVote = false;
    if (voterInfo && voterInfo[0] && Array.isArray(voterInfo[0].votes)) {
      const voterVotes = voterInfo[0].votes;
      hasPendingVote = voterVotes.some((vote: CeloVote) => {
        const pendingAmount = BigInt((vote.pending || 0).toString());
        return pendingAmount > 0n;
      });
    }

    const pendingParams = buildTransactionParams("celo", "getPendingWithdrawals", {
      recipient: address,
    });
    const pendingData = encodeStakingData({
      currencyId: "celo",
      operation: "getPendingWithdrawals",
      config,
      params: pendingParams,
    });

    const pendingResult = await api.call({
      to: config.contractAddress,
      data: pendingData,
    });

    const pendingWithdrawals = decodeStakingResult(
      "celo",
      "getPendingWithdrawals",
      config,
      pendingResult,
    );

    // Check 24h cooldown
    const now = Math.floor(Date.now() / 1000);
    const COOLDOWN_24H = 24 * 60 * 60;

    let canActivate = false;
    let pendingWithdrawalsCount = 0;

    if (Array.isArray(pendingWithdrawals) && pendingWithdrawals.length > 0) {
      pendingWithdrawalsCount = pendingWithdrawals.length;

      canActivate = pendingWithdrawals.some((withdrawal: CeloPendingWithdrawal) => {
        const timestamp = Number(withdrawal.timestamp || 0);
        return timestamp > 0 && now - timestamp >= COOLDOWN_24H;
      });
    }

    const stakeData: StakeData = {
      type: "active",
      hasPendingVote,
      canActivate,
      pendingWithdrawalsCount,
    };

    return calculateStakeConditions("celo", stakeData);
  } catch (error) {
    console.warn(`Failed to fetch Celo conditions:`, error);
    return { activatable: false, revokable: false, withdrawable: false, status: "error" };
  }
};

/**
 * Fetch Sei conditions
 */
const fetchSeiConditions = async (
  _api: RpcProvider,
  _config: StakingContractConfig,
  _address: string,
  _validatorAddress: string,
): Promise<StakeConditions> => {
  // Sei mostly always available
  return calculateStakeConditions("sei_network_evm", {
    type: "active",
    hasPendingVote: false,
    canActivate: true,
    pendingWithdrawalsCount: 0,
  });
};
