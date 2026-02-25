import BigNumber from "bignumber.js";

// see: https://solidity.readthedocs.io/en/v0.6.1/abi-spec.html#function-selector-and-argument-encoding
export const abiEncodeTrc20Transfer = (address: string, amount: BigNumber): string => {
  const encodedAddress = address.padStart(64, "0");
  const hexAmount = amount.toNumber().toString(16); // convert to hexadecimal

  const encodedAmount = hexAmount.padStart(64, "0");
  return encodedAddress.concat(encodedAmount);
};

export const hexToAscii = (hex: string): string => Buffer.from(hex, "hex").toString("ascii");
