/// <reference types="node" />
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
    }>) => import("rxjs").Observable<{
        name: string;
        version: string;
        flags: number | Buffer;
    }>;
};
export default _default;
//# sourceMappingURL=deviceAppVersion.d.ts.map