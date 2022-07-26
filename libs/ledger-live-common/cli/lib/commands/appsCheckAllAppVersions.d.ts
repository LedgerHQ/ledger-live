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
        desc: string;
    })[];
    job: ({ device, memo, }: Partial<{
        device: string;
        memo: string;
    }>) => import("rxjs").Observable<never>;
};
export default _default;
//# sourceMappingURL=appsCheckAllAppVersions.d.ts.map