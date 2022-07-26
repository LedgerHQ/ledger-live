import { Observable } from "rxjs";
declare type Scenario = number[];
declare const scenarios: Record<string, Scenario>;
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
        desc: string;
    })[];
    job: ({ device, scenario, }: Partial<{
        device: string;
        scenario: keyof typeof scenarios;
    }>) => Observable<unknown>;
};
export default _default;
//# sourceMappingURL=devDeviceAppsScenario.d.ts.map