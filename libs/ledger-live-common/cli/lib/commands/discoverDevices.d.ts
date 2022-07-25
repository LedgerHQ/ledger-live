declare const _default: {
    args: ({
        name: string;
        alias: string;
        type: StringConstructor;
        desc: string;
    } | {
        name: string;
        alias: string;
        type: BooleanConstructor;
        desc: string;
    })[];
    job: ({ module, interactive, }: Partial<{
        module: string;
        interactive: boolean;
    }>) => import("rxjs").Observable<{
        type: "add" | "remove";
        id: string;
        name: string;
    }> | import("rxjs").Observable<string>;
};
export default _default;
//# sourceMappingURL=discoverDevices.d.ts.map