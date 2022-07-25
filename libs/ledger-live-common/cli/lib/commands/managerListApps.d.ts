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
        alias: string;
        type: StringConstructor;
        typeDesc: string;
    })[];
    job: ({ device, format, }: Partial<{
        device: string;
        format: string;
    }>) => import("rxjs").Observable<any>;
};
export default _default;
//# sourceMappingURL=managerListApps.d.ts.map