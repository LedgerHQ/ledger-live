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

const TRC20_TRANSFER_SELECTOR = "a9059cbb";

export type Trc20TransferData = {
  to: string;
  amount: BigNumber;
};

export const abiDecodeTrc20Transfer = (data: string): Trc20TransferData | null => {
  const cleanData = data.startsWith("0x") ? data.slice(2) : data;
  if (cleanData.length < 8 + 64 + 64) return null;
  const selector = cleanData.slice(0, 8).toLowerCase();
  if (selector !== TRC20_TRANSFER_SELECTOR) return null;

  const toHex = cleanData.slice(8, 72);
  const amountHex = cleanData.slice(72, 136);
  const to = "41" + toHex.slice(24);
  const amount = new BigNumber(amountHex, 16);

  return { to, amount };
};

export const hexToAscii = (hex: string): string => Buffer.from(hex, "hex").toString("ascii");
