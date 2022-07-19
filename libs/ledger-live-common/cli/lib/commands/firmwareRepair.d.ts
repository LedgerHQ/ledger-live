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
        type: StringConstructor;
        desc: string;
    })[];
    job: ({ device, forceMCU, }: Partial<{
        device: string;
        forceMCU: string;
    }>) => import("rxjs").Observable<{
        progress: number;
    }>;
};
export default _default;
//# sourceMappingURL=firmwareRepair.d.ts.map