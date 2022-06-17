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
    })[];
    job: (arg: any) => import("rxjs").Observable<import("../../../lib/hw/signMessage/types").Result>;
};
export default _default;
//# sourceMappingURL=signMessage.d.ts.map