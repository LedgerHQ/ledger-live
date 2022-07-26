declare const _default: {
    args: ({
        name: string;
        alias: string;
        type: StringConstructor;
        descOpt: string;
        desc: string;
    } | {
        name: string;
        alias: string;
        type: StringConstructor;
    })[];
    job: ({ device, currency, hash, }: Partial<{
        device: string;
        currency: string;
        hash: string;
    }>) => import("rxjs").Observable<"Backend returned no hex for this hash" | {
        inHash: any;
        finalOut: string;
    }>;
};
export default _default;
//# sourceMappingURL=testGetTrustedInputFromTxHash.d.ts.map