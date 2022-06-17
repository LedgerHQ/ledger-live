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
        alias?: undefined;
    } | {
        name: string;
        alias: string;
        type: BooleanConstructor;
        desc: string;
    })[];
    job: (arg: Partial<{
        currency: string;
        device: string;
        path: string;
        derivationMode: string;
        verify: boolean;
    }>) => import("rxjs").Observable<import("../../../lib/hw/getAddress/types").Result>;
};
export default _default;
//# sourceMappingURL=getAddress.d.ts.map