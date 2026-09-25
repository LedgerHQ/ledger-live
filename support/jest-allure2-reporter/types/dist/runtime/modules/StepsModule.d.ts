import type { AllureTestItemMetadataProxy } from '../../metadata';
import type { AllureRuntimeContext } from '../AllureRuntimeContext';
export type BasicStepsModuleContext = {
    readonly metadata: AllureTestItemMetadataProxy;
    readonly now: number;
};
export declare class StepsModule {
    #private;
    protected readonly context: BasicStepsModuleContext;
    constructor(context: BasicStepsModuleContext);
    static create(context: AllureRuntimeContext): StepsModule;
    step<T = unknown>(name: string, function_: () => T): T;
}
