import { z } from "zod";

/**
 * Thunk `extraArgument` contract for every CoinMarketCap-backed api. The app supplies the resolved
 * CoinMarketCap URL at store configuration time, so this package owns no env/config dependency.
 */
export const CoinMarketCapApiExtraSchema = z.object({
  coinMarketCapApiUrl: z.string().min(1),
});
