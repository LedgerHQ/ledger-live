import { Observable } from "rxjs";
declare const _default: {
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
        desc: string;
    } | {
        name: string;
        alias: string;
        type: BooleanConstructor;
        desc: string;
    } | {
        name: string;
        type: BooleanConstructor;
        desc: string;
        alias?: undefined;
    })[];
    job: ({ device, file, record, port, silent, verbose, "disable-auto-skip": noAutoSkip, }: {
        device: any;
        file: any;
        record: any;
        port: any;
        silent: any;
        verbose: any;
        "disable-auto-skip": any;
    }) => Observable<unknown>;
};
export default _default;
//# sourceMappingURL=proxy.d.ts.map