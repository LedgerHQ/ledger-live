import { type CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { type StakingContractConfig } from "../../types";
import { type Stake } from "@ledgerhq/coin-module-framework/api/types";

export async function fetchSomniaStakes(
  _address: string,
  _config: StakingContractConfig,
  _currency: CryptoCurrency,
): Promise<Stake[]> {
  return [];
}
