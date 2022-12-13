import erc20 from "./data/erc20";
import coins from "./data/coins";

/**
 * coin and token configs are extracted from the app-exchange repo and differ from the
 * prod ones only on the signature (third index of each config) because the test configs are signed
 * using the Ledger test private key (available in the app-exchange repo)
 * https://github.com/LedgerHQ/app-exchange/blob/61da20e3a1b70742e91669221f7ee2db237f3545/test/tools/index.js#L82-L106
 */

const all = [...coins, ...erc20];
const configs = {};

for (const [id, config, signature] of all) {
  configs[id] = {
    config,
    signature,
  };
}

/**
 *
 */
export const findTestExchangeCurrencyConfig = (
  id: string
):
  | {
      config: string;

      signature: string;
    }
  | null
  | undefined => configs[id];
