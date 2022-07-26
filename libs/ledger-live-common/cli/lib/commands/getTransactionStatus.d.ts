import { Observable } from "rxjs";
import type { ScanCommonOpts } from "../scan";
import type { InferTransactionsOpts } from "../transaction";
declare const _default: {
    description: string;
    args: ({
        name: string;
        alias: string;
        type: StringConstructor;
        desc: string;
    } | {
        name: string;
        alias: string;
        type: NumberConstructor;
        desc: string;
        multiple?: undefined;
        typeDesc?: undefined;
    } | {
        name: string;
        type: NumberConstructor;
        desc: string;
        multiple?: undefined;
        typeDesc?: undefined;
        alias?: undefined;
    } | {
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
    } | {
        name: string;
        alias: string;
        type: StringConstructor;
        typeDesc: string;
        desc: string;
    })[];
    job: (opts: ScanCommonOpts & InferTransactionsOpts & {
        format: string;
    }) => Observable<any>;
};
export default _default;
//# sourceMappingURL=getTransactionStatus.d.ts.map