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
        type: BooleanConstructor;
        desc: string;
    })[];
    job: (opts: ScanCommonOpts & {
        qr: boolean;
        freshAddressIndex: number | null | undefined;
    }) => import("rxjs").Observable<string>;
};
export default _default;
//# sourceMappingURL=receive.d.ts.map