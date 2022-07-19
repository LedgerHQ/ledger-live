import type { ScanCommonOpts } from "../scan";
declare type SwapJobOpts = ScanCommonOpts & {
    amount: string;
    useAllAmount: boolean;
    useFloat: boolean;
    wyreUserId?: string;
    _unknown: any;
    deviceId: string;
    tokenId: string;
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
        type: BooleanConstructor;
        desc: string;
    })[];
    job: (opts: SwapJobOpts) => import("rxjs").Observable<void>;
};
export default _default;
//# sourceMappingURL=swap.d.ts.map