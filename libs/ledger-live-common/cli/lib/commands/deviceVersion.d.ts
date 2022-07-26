declare const _default: {
    args: {
        name: string;
        alias: string;
        type: StringConstructor;
        descOpt: string;
        desc: string;
    }[];
    job: ({ device, }: Partial<{
        device: string;
    }>) => import("rxjs").Observable<import("../../../lib/types/manager").FirmwareInfo>;
};
export default _default;
//# sourceMappingURL=deviceVersion.d.ts.map