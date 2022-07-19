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
        alias: string;
        type: StringConstructor;
        typeDesc: string;
        desc: string;
    })[];
    job: ({ device, file }: {
        device: string;
        file: string;
    }) => import("rxjs").Observable<string>;
};
export default _default;
//# sourceMappingURL=repl.d.ts.map