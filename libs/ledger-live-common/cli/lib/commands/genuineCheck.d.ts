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
    }>) => import("rxjs").Observable<import("../../../lib/types/manager").SocketEvent>;
};
export default _default;
//# sourceMappingURL=genuineCheck.d.ts.map