import "lodash.product";
declare type Opts = Partial<{
    currency: string[];
    countervalue: string[];
    fiats: boolean;
    format: string;
    period: string;
    verbose: boolean;
    marketcap: number;
    disableAutofillGaps: boolean;
    latest: boolean;
    startDate: string;
}>;
declare const _default: {
    description: string;
    args: ({
        name: string;
        alias: string;
        type: StringConstructor;
        multiple: boolean;
        desc: string;
        typeDesc?: undefined;
        desk?: undefined;
    } | {
        name: string;
        alias: string;
        type: StringConstructor;
        desc: string;
        multiple?: undefined;
        typeDesc?: undefined;
        desk?: undefined;
    } | {
        name: string;
        alias: string;
        type: StringConstructor;
        typeDesc: string;
        desc: string;
        multiple?: undefined;
        desk?: undefined;
    } | {
        name: string;
        alias: string;
        type: BooleanConstructor;
        multiple?: undefined;
        desc?: undefined;
        typeDesc?: undefined;
        desk?: undefined;
    } | {
        name: string;
        type: BooleanConstructor;
        desc: string;
        alias?: undefined;
        multiple?: undefined;
        typeDesc?: undefined;
        desk?: undefined;
    } | {
        name: string;
        alias: string;
        type: NumberConstructor;
        desc: string;
        multiple?: undefined;
        typeDesc?: undefined;
        desk?: undefined;
    } | {
        name: string;
        alias: string;
        type: BooleanConstructor;
        desc: string;
        multiple?: undefined;
        typeDesc?: undefined;
        desk?: undefined;
    } | {
        name: string;
        alias: string;
        type: StringConstructor;
        desk: string;
        multiple?: undefined;
        desc?: undefined;
        typeDesc?: undefined;
    })[];
    job: (opts: Opts) => any;
};
export default _default;
//# sourceMappingURL=countervalues.d.ts.map