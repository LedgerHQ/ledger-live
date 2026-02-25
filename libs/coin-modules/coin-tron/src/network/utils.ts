import BigNumber from "bignumber.js";

// see: https://solidity.readthedocs.io/en/v0.6.1/abi-spec.html#function-selector-and-argument-encoding
// Use toString(16) on BigNumber to preserve full uint256 precision (avoid toNumber() which is limited to 2^53).
export const abiEncodeTrc20Transfer = (address: string, amount: BigNumber): string => {
  const encodedAddress = address.padStart(64, "0");
  const hexAmount = amount.isInteger()
    ? amount.toString(16)
    : amount.integerValue(BigNumber.ROUND_FLOOR).toString(16);

  const encodedAmount = hexAmount.padStart(64, "0");
  return encodedAddress.concat(encodedAmount);
};

export const hexToAscii = (hex: string): string => Buffer.from(hex, "hex").toString("ascii");
