import "lodash.product";
import type { TransactionStatus, Transaction, Account } from "@ledgerhq/live-common/lib/types";
export declare type InferTransactionsOpts = Partial<{
    "self-transaction": boolean;
    "use-all-amount": boolean;
    recipient: string[];
    amount: string;
    shuffle: boolean;
    "fees-strategy": string;
    collection: string;
    tokenIds: string;
    quantities: string;
}>;
export declare const inferTransactionsOpts: ({
    name: string;
    type: BooleanConstructor;
    desc: string;
    multiple?: undefined;
} | {
    name: string;
    type: StringConstructor;
    desc: string;
    multiple: boolean;
} | {
    name: string;
    type: StringConstructor;
    desc: string;
    multiple?: undefined;
})[];
export declare function inferTransactions(mainAccount: Account, opts: InferTransactionsOpts): Promise<[Transaction, TransactionStatus][]>;
//# sourceMappingURL=transaction.d.ts.map