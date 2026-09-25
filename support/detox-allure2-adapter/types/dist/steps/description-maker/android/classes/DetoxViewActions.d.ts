import { StepDescription, StepDescriptionFriendly } from '../../types';
import type { ArgumentFormatter } from '../core';
export declare class DetoxViewActions {
    static click(): ViewActionResult;
    static typeText(text: string): ViewActionResult;
}
export declare class ViewActionResult implements ArgumentFormatter {
    private readonly actionName;
    private readonly params?;
    constructor(actionName: string, params?: Record<string, any> | undefined);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
