import { Transaction } from "./Transaction";
import { Fee } from "../enum/Fee";
import { Account } from "../enum/Account";
import { SwapProvider } from "../enum/Provider";
export type SwapType = Swap;
export declare class Swap extends Transaction {
    provider?: SwapProvider | undefined;
    speed?: Fee | undefined;
    amountToReceive?: string | undefined;
    feesAmount?: string | undefined;
    constructor(accountToDebit: Account, accountToCredit: Account, amount: string, provider?: SwapProvider | undefined, speed?: Fee | undefined, amountToReceive?: string | undefined, feesAmount?: string | undefined);
    setAmountToReceive(value: string): void;
    setProvider(provider: SwapProvider): void;
    setFeesAmount(value: string): void;
    get getAmount(): string;
    get getAccountToDebit(): Account;
    get getAccountToCredit(): Account;
    get getProvider(): SwapProvider | undefined;
}
//# sourceMappingURL=Swap.d.ts.map