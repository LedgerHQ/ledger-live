import { ethers, type JsonRpcProvider } from "ethers";
import { log } from "@ledgerhq/logs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { getCoinConfig } from "../../config";
import { withApi } from "../../network/node/rpc.common";
import { isExternalNodeConfig } from "../../network/node/types";
import { getStakingABI } from "../abis";

// TODO: stopgap - hardcoded because contracts.ts cannot import from monad.ts (circular dep).
// Fix when getStakingApi(currencyId) factory replaces the Record in contracts.ts.
const MONAD_PRECOMPILE = "0x0000000000000000000000000000000000001000";

// getValidator returns 12 fields; we only type/validate the ones we read:
// [0] authAddress, [2] stake, [4] commission, [10] secpPubkey (bytes -> hex string).
export type ValidatorRaw = [
  string,
  unknown,
  bigint,
  unknown,
  bigint,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  string,
];

export function isValidatorRaw(value: unknown): value is ValidatorRaw {
  return (
    Array.isArray(value) &&
    typeof value[0] === "string" &&
    typeof value[2] === "bigint" &&
    typeof value[4] === "bigint" &&
    typeof value[10] === "string"
  );
}

export const callGetValidator = async (
  provider: JsonRpcProvider,
  iface: ethers.Interface,
  contractAddress: string,
  valId: bigint,
): Promise<ValidatorRaw | null> => {
  const data = iface.encodeFunctionData("getValidator", [valId]);
  const raw = await provider.call({ to: contractAddress, data });
  const decoded = iface.decodeFunctionResult("getValidator", raw);
  return isValidatorRaw(decoded) ? decoded : null;
};

export const getValidatorAddressById = async (
  currencyId: string,
  valId: bigint,
): Promise<string | null> => {
  const abi = getStakingABI(currencyId);
  if (!abi) return null;

  const node = getCoinConfig(currencyId).info.node;
  if (!isExternalNodeConfig(node)) return null;

  try {
    const currency = getCryptoCurrencyById(currencyId);
    return await withApi(
      currency,
      async provider => {
        const iface = new ethers.Interface(abi as ethers.InterfaceAbi);
        const decoded = await callGetValidator(provider, iface, MONAD_PRECOMPILE, valId);
        if (!decoded) return null;
        const [, , , , , , , , , , secpPubkey] = decoded;
        return ethers.computeAddress(secpPubkey);
      },
      node,
    );
  } catch (error) {
    log("coin-evm/staking", "getValidatorAddressById: getValidator call failed", {
      currencyId,
      valId: valId.toString(),
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};
