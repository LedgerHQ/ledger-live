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
    }>) => import("rxjs").Observable<import("../../../lib/types/manager").DeviceInfo>;
};
export default _default;
//# sourceMappingURL=deviceInfo.d.ts.map