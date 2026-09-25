import type { Function_ } from '../../utils';
import type { AllureRuntime, HandlebarsAPI, UserParameter } from '../types';
export type FunctionalStepsModuleContext = {
    runtime: Pick<AllureRuntime, 'step' | 'parameter'>;
    handlebars: HandlebarsAPI;
};
export declare class StepsDecorator {
    protected readonly context: FunctionalStepsModuleContext;
    constructor(context: FunctionalStepsModuleContext);
    createStep<T, F extends Function_<T>>(nameFormat: string, function_: F, userParameters?: UserParameter[]): F;
}
