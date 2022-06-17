import type { ScanCommonOpts } from "../scan";
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
    } | {
        name: string;
        alias: string;
        type: StringConstructor;
        typeDesc: string;
        desc: string;
    })[];
    job: (opts: ScanCommonOpts & {
        format: string;
        period: string;
    }) => import("rxjs").Observable<any>;
};
export default _default;
//# sourceMappingURL=balanceHistory.d.ts.map