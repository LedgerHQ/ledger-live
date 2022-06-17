import type { CompoundAccountSummary } from "@ledgerhq/live-common/lib/compound/types";
import type { ScanCommonOpts } from "../scan";
declare const compoundSummaryFormatter: {
    summary: (summary: CompoundAccountSummary) => string;
    default: (summary: CompoundAccountSummary) => string;
};
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
        format: keyof typeof compoundSummaryFormatter;
    }) => import("rxjs").Observable<string>;
};
export default _default;
//# sourceMappingURL=makeCompoundSummary.d.ts.map