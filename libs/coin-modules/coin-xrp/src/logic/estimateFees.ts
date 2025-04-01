import { NetworkDown } from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { getServerInfos } from "../network";
import { NetworkInfo } from "../types";
import { parseAPIValue } from "./common";

// FIXME this could be cleaner
const remapError = (error: Error) => {
  const msg = error.message;

  if (msg.includes("Unable to resolve host") || msg.includes("Network is down")) {
    return new NetworkDown();
  }

  return error;
};

export async function estimateFees(
  networkInfo?: NetworkInfo | null,
): Promise<{ networkInfo: NetworkInfo; fee: bigint }> {
  if (!networkInfo) {
    try {
      const info = await getServerInfos();
      const serverFee = parseAPIValue(info.info.validated_ledger.base_fee_xrp.toString());
      networkInfo = {
        family: "xrp",
        serverFee,
        baseReserve: new BigNumber(0), // NOT USED. will refactor later.
      };
    } catch (e) {
      if (e instanceof Error) {
        throw remapError(e);
      }
      throw e;
    }
  }

  return { networkInfo, fee: BigInt(networkInfo.serverFee.toString()) };
}
