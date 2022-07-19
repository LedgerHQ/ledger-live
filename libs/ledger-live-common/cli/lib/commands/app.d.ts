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
        type: BooleanConstructor;
        desc: string;
        multiple?: undefined;
    } | {
        name: string;
        alias: string;
        type: StringConstructor;
        desc: string;
        multiple: boolean;
    } | {
        name: string;
        alias: string;
        type: StringConstructor;
        desc: string;
        multiple?: undefined;
    } | {
        name: string;
        type: StringConstructor;
        desc: string;
        alias?: undefined;
        multiple?: undefined;
    })[];
    job: ({ device, verbose, install, uninstall, open, quit, debug, }: Partial<{
        device: string;
        verbose: boolean;
        install: string[];
        uninstall: string[];
        open: string;
        quit: string;
        debug: string;
    }>) => import("rxjs").Observable<any>;
};
export default _default;
//# sourceMappingURL=app.d.ts.map