declare const _default: {
    description: string;
    args: {
        name: string;
        alias: string;
        type: StringConstructor;
        desc: string;
    }[];
    job: (opts: Partial<{
        device: string;
        currency: string;
    }>) => import("rxjs").Observable<import("@ledgerhq/live-common/lib/families/bitcoin/descriptor").AccountDescriptor>;
};
export default _default;
//# sourceMappingURL=scanDescriptors.d.ts.map