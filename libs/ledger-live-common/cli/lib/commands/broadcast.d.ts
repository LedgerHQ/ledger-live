import type { ScanCommonOpts } from "../scan";
import type { InferSignedOperationsOpts } from "../signedOperation";
declare const _default: {
    description: string;
    args: ({
        name: string;
        alias: string;
        type: StringConstructor;
        desc: string;
    } | {
        name: string;
        type: StringConstructor;
        desc: string;
        multiple: boolean;
        typeDesc?: undefined;
        alias?: undefined;
    } | {
        name: string;
        type: StringConstructor;
        typeDesc: string;
        desc: string;
        multiple?: undefined;
        alias?: undefined;
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
    })[];
    job: (opts: ScanCommonOpts & InferSignedOperationsOpts) => import("rxjs").Observable<string>;
};
export default _default;
//# sourceMappingURL=broadcast.d.ts.map