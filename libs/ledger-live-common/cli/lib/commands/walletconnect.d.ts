import type { ScanCommonOpts } from "../scan";
declare type Opts = ScanCommonOpts & Partial<{
    walletConnectURI: string;
    walletConnectSession: string;
    verbose: boolean;
    silent: boolean;
}>;
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
    } | {
        name: string;
        type: BooleanConstructor;
        desc: string;
        alias?: undefined;
    })[];
    job: (opts: Opts) => any;
};
export default _default;
//# sourceMappingURL=walletconnect.d.ts.map