import coins from "./data/coins";
const all = [...coins];
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
