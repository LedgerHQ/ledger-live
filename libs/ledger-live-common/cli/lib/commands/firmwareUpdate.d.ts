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
        type: BooleanConstructor;
        desc: string;
    } | {
        name: string;
        type: StringConstructor;
        desc: string;
    })[];
    job: ({ device, osuVersion, "to-my-own-risk": toMyOwnRisk, listOSUs, }: Partial<{
        device: string;
        osuVersion: string;
        "to-my-own-risk": boolean;
        listOSUs: boolean;
    }>) => import("rxjs").Observable<unknown>;
};
export default _default;
//# sourceMappingURL=firmwareUpdate.d.ts.map