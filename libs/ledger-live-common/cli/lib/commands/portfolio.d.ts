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
        type: StringConstructor;
        desc: string;
        alias?: undefined;
    } | {
        name: string;
        alias: string;
        type: BooleanConstructor;
        desc: string;
    })[];
    job: (opts: Partial<Partial<{
        device: string;
        id: string[];
        xpub: string[];
        file: string;
        appjsonFile: string;
        currency: string;
        scheme: string;
        index: number;
        length: number;
        paginateOperations: number;
    }> & {
        disableAutofillGaps: boolean;
        countervalue: string;
        period: string;
    }>) => import("rxjs").Observable<string>;
};
export default _default;
//# sourceMappingURL=portfolio.d.ts.map