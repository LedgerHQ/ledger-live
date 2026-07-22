import "@shared/env";
import { registerAllCoins } from "../../coin-modules/load-all-coins";

registerAllCoins();

if (process.env.CI) {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
}
