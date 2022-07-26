declare const _default: {
    description: string;
    args: {
        name: string;
        alias: string;
        type: StringConstructor;
        descOpt: string;
        desc: string;
    }[];
    job: ({ device, }: Partial<{
        device: string;
    }>) => import("rxjs").Observable<import("@ledgerhq/live-common/lib/apps").State>;
};
export default _default;
//# sourceMappingURL=appsInstallAll.d.ts.map