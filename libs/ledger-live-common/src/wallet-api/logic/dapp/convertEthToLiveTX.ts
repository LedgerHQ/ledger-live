import BigNumber from "bignumber.js";
import { safeEncodeEIP55 } from "@ledgerhq/coin-evm/utils";
import { WalletAPITransaction } from "../../types";
import { EthTransaction } from "./types";

export function convertEthToLiveTX(ethTX: EthTransaction): WalletAPITransaction {
  return {
    family: "ethereum",
    amount:
      ethTX.value !== undefined
        ? new BigNumber(ethTX.value.replace("0x", ""), 16)
        : new BigNumber(0),
    recipient: safeEncodeEIP55(ethTX.to),
    gasPrice:
      ethTX.gasPrice !== undefined
        ? new BigNumber(ethTX.gasPrice.replace("0x", ""), 16)
        : undefined,
    gasLimit: ethTX.gas !== undefined ? new BigNumber(ethTX.gas.replace("0x", ""), 16) : undefined,
    data: ethTX.data ? Buffer.from(ethTX.data.replace("0x", ""), "hex") : undefined,
  };
}
