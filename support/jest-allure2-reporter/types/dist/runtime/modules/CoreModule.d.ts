import type { LabelName, Link, Parameter, Primitive, Status, StatusDetails } from '@support/jest-allure2-reporter';
import type { AllureTestItemMetadataProxy } from '../../metadata';
import type { AllureRuntimeContext } from '../AllureRuntimeContext';
export type CoreModuleContext = {
    readonly metadata: AllureTestItemMetadataProxy;
};
export declare class CoreModule {
    protected readonly context: CoreModuleContext;
    constructor(context: CoreModuleContext);
    static create(context: AllureRuntimeContext): CoreModule;
    displayName(value: string): void;
    parameter(parameter: Parameter): void;
    status(status: Status): void;
    statusDetails(statusDetails: StatusDetails): void;
    description(value: string): void;
    descriptionHtml(value: string): void;
    fullName(value: string): void;
    historyId(value: Primitive): void;
    label(name: LabelName, value: string): void;
    link(link: Link): void;
}
