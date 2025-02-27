import BigNumber from "bignumber.js";
import type { BandwidthInfo, NetworkInfo } from "../types";

// see: https://solidity.readthedocs.io/en/v0.6.1/abi-spec.html#function-selector-and-argument-encoding
export const abiEncodeTrc20Transfer = (address: string, amount: BigNumber): string => {
  const encodedAddress = address.padStart(64, "0");
  const hexAmount = amount.toNumber().toString(16); // convert to hexadecimal

  const encodedAmount = hexAmount.padStart(64, "0");
  return encodedAddress.concat(encodedAmount);
};

export const hexToAscii = (hex: string): string => Buffer.from(hex, "hex").toString("ascii");

//FIXME duplication with bridge/utils::extractBandwidthInfo
export const extractBandwidthInfo = (
  networkInfo: NetworkInfo | null | undefined,
): BandwidthInfo => {
  // Calculate bandwidth info :
  if (networkInfo) {
    const { freeNetUsed, freeNetLimit, netUsed, netLimit } = networkInfo;
    return {
      freeUsed: freeNetUsed,
      freeLimit: freeNetLimit,
      gainedUsed: netUsed,
      gainedLimit: netLimit,
    };
  }

  return {
    freeUsed: new BigNumber(0),
    freeLimit: new BigNumber(0),
    gainedUsed: new BigNumber(0),
    gainedLimit: new BigNumber(0),
  };
};
