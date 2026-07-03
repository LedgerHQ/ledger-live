import { Account } from "./enum/Account";
import { SwapProvider } from "./enum/Provider";
export declare function getMinimumSwapAmount(accountFrom: Account, accountTo: Account, providersWhitelist?: string[]): Promise<number | null>;
export declare function pickRotatingProvider(eligibleProviders: SwapProvider[], accountFrom: Account, accountTo: Account): Promise<SwapProvider>;
//# sourceMappingURL=swap.d.ts.map