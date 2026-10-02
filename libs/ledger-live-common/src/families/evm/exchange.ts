import BigNumber from "bignumber.js";
import { getErc20Data } from "@ledgerhq/coin-evm/logic";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { getCurrencyConfiguration } from "../../config";

const NATIVE_TO_ALIAS_AMOUNT_DIVISOR = new BigNumber(10).pow(12);

export function buildArcAliasTransfer({
  currencyId,
  recipient,
  amount,
}: {
  currencyId: string;
  recipient: string;
  amount: BigNumber;
}): { recipient: string; amount: BigNumber; useAllAmount: false; data: Buffer } {
  const [aliasAddress] = getCurrencyConfiguration<EvmConfigInfo>(currencyId).nativeContracts ?? [];
  if (!aliasAddress) {
    throw new Error(`No native contract configured for ${currencyId}`);
  }
  const aliasAmount = amount.dividedBy(NATIVE_TO_ALIAS_AMOUNT_DIVISOR);
  if (!aliasAmount.isInteger()) {
    throw new Error(`Arc swap amount ${amount.toFixed()} has more than 6 decimals`);
  }
  return {
    recipient: aliasAddress,
    amount: new BigNumber(0),
    useAllAmount: false,
    data: getErc20Data(recipient, BigInt(aliasAmount.toFixed())),
  };
}
