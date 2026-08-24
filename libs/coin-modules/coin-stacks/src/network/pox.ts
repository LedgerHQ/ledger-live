import network from "@ledgerhq/live-network/network";
import {
  cvToJSON,
  fetchCallReadOnlyFunction,
  noneCV,
  principalCV,
  standardPrincipalCV,
  uintCV,
} from "@stacks/transactions";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { getStacksBaseUrl } from "./api";
import { PoxInfoResponse } from "../types/api";

/** `GET /v2/pox` — the currently active PoX contract, resolved dynamically (never hardcoded). */
export const fetchPoxInfo = async (): Promise<PoxInfoResponse> => {
  const opts: AxiosRequestConfig = { method: "GET", url: `${getStacksBaseUrl()}/v2/pox` };
  const { data } = (await network(opts)) as AxiosResponse<PoxInfoResponse>;
  return data;
};

const splitContractId = (contractId: string): { address: string; name: string } => {
  const [address, name] = contractId.split(".");
  return { address, name };
};

export type StakerInfo = {
  amountUstx: bigint;
  firstRewardCycle: number;
  numCycles: number;
  signer: string;
};

/** pox-5's `get-staker-info(staker)` — `none` when the staker has never staked, or once the lock
 * period (first-reward-cycle + num-cycles) has elapsed (there is no separate "unstaked" flag). */
export const fetchStakerInfo = async (
  poxContractId: string,
  stakerAddress: string,
): Promise<StakerInfo | undefined> => {
  const { address, name } = splitContractId(poxContractId);
  const result = await fetchCallReadOnlyFunction({
    contractAddress: address,
    contractName: name,
    functionName: "get-staker-info",
    functionArgs: [standardPrincipalCV(stakerAddress)],
    senderAddress: stakerAddress,
    client: { baseUrl: getStacksBaseUrl() },
  });

  const decoded = cvToJSON(result);
  if (decoded.value === null || decoded.value === undefined) {
    return undefined;
  }

  const staker = decoded.value.value as Record<string, { value: string }>;
  return {
    amountUstx: BigInt(staker["amount-ustx"].value),
    firstRewardCycle: Number(staker["first-reward-cycle"].value),
    numCycles: Number(staker["num-cycles"].value),
    signer: staker.signer.value,
  };
};

/** pox-5's `get-earned-staker-rewards(signer, reward-cycle, bond-index, staker)` — the sBTC amount
 * accrued but not yet claimed by the staker's pool. Protocol-uniform (unlike claiming itself,
 * which is pool-contract-specific). Returns 0n when nothing has accrued yet. */
export const fetchEarnedStakerRewards = async (
  poxContractId: string,
  signer: string,
  rewardCycle: number,
  staker: string,
): Promise<bigint> => {
  const { address, name } = splitContractId(poxContractId);
  const result = await fetchCallReadOnlyFunction({
    contractAddress: address,
    contractName: name,
    functionName: "get-earned-staker-rewards",
    functionArgs: [principalCV(signer), uintCV(rewardCycle), noneCV(), standardPrincipalCV(staker)],
    senderAddress: staker,
    client: { baseUrl: getStacksBaseUrl() },
  });

  const decoded = cvToJSON(result);
  const value = decoded.type === "uint" ? decoded.value : decoded.value?.value;
  return value !== undefined ? BigInt(value) : 0n;
};
