import { registerCoinModules } from "./registry";
import { coinModuleLoaders } from "./loaders";

export function registerAllCoins(): void {
  registerCoinModules(coinModuleLoaders);
}
