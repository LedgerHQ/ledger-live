declare const _default: {
    description: string;
    args: ({
        name: string;
        alias: string;
        type: StringConstructor;
        descOpt: string;
        desc: string;
    } | {
        name: string;
        type: BooleanConstructor;
        desc: string;
        typeDesc?: undefined;
    } | {
        name: string;
        type: StringConstructor;
        typeDesc: string;
        desc: string;
    } | {
        name: string;
        type: StringConstructor;
        desc: string;
        typeDesc?: undefined;
    })[];
    job: ({ "no-device": noDevice, "no-save": noSave, device, lss, rpcHOST, rpcUSER, rpcPASSWORD, rpcTLS, }: {
        "no-device": boolean;
        "no-save": boolean;
        device: string;
        lss: string;
        rpcHOST: string;
        rpcUSER: string;
        rpcPASSWORD: string;
        rpcTLS: boolean;
    }) => import("rxjs").Observable<string>;
};
export default _default;
//# sourceMappingURL=satstack.d.ts.map