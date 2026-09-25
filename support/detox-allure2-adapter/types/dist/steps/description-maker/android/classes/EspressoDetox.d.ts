import { StepDescription, StepDescriptionFriendly } from '../../types';
import type { ArgumentFormatter } from '../core';
export declare class EspressoDetox {
    static getViewMatcher(matcher: StepDescriptionFriendly): StepDescriptionFriendly;
    static getViewInteraction(matcher: StepDescriptionFriendly): StepDescriptionFriendly;
    static perform(viewInteraction: StepDescriptionFriendly, viewAction: ArgumentFormatter): StepDescription | null;
    static check(viewInteraction: StepDescriptionFriendly, viewAssertion: ArgumentFormatter): StepDescription | null;
    static performAction(element: StepDescriptionFriendly, action: ArgumentFormatter): StepDescription | null;
    static changeOrientation(orientation: string): StepDescription;
    static setSynchronization(enabled: boolean): StepDescription;
    static setURLBlacklist(urls: string[]): StepDescription;
    static tap(x: number, y: number, shouldIgnoreStatusBar: boolean): StepDescription;
    static longPress(x: number, y: number, shouldIgnoreStatusBar: boolean, duration?: number): StepDescription;
}
