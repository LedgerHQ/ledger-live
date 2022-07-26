import type { Observable } from "rxjs";
import type { SignedOperation, Account } from "@ledgerhq/live-common/lib/types";
export declare type InferSignedOperationsOpts = Partial<{
    "signed-operation": string;
}>;
export declare const inferSignedOperationsOpts: {
    name: string;
    alias: string;
    type: StringConstructor;
    desc: string;
}[];
export declare function inferSignedOperations(mainAccount: Account, opts: InferSignedOperationsOpts): Observable<SignedOperation>;
//# sourceMappingURL=signedOperation.d.ts.map