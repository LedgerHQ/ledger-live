const all = [];
const configs = {};

/**
 *
 */
export const findExchangeCurrencyConfig = (
  id: string,
):
  | {
      config: string;

      signature: string;
    }
  | null
  | undefined => configs[id];
