import { Account, TokenAccount } from "../enum/Account";
import { Transaction } from "../models/Transaction";
export declare const sendConcordium: (tx: Transaction) => void | Promise<void>;
export declare function getCcdAccountAddress(account: Account | TokenAccount): Promise<string>;
//# sourceMappingURL=concordium.d.ts.map