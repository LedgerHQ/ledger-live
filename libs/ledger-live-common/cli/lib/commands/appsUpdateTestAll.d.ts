import { Observable } from "rxjs";
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
        type: NumberConstructor;
    })[];
    job: ({ device, index, }: Partial<{
        device: string;
        index: number;
    }>) => Observable<Observable<unknown>>;
};
export default _default;
//# sourceMappingURL=appsUpdateTestAll.d.ts.map