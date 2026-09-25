import type { StepDescription, StepDescriptionFriendly } from '../../types';
import { DetoxMatcher } from './DetoxMatcher';
import { DetoxWebAtomMatcher } from './DetoxWebAtomMatcher';
export declare class EspressoWebDetox {
    static getWebView(matcher?: DetoxMatcher): GetWebViewResult;
    static expect(webElement: ElementResult): ExpectResult;
}
declare class GetWebViewResult implements StepDescriptionFriendly {
    private readonly matcher?;
    constructor(matcher?: DetoxMatcher | undefined);
    element(matcher: DetoxWebAtomMatcher, index?: number): ElementResult;
    toJSON(): StepDescription;
}
declare class ExpectResult {
    private readonly webElement;
    constructor(webElement: ElementResult);
    toExist(): StepDescription;
    toHaveText(text: string): StepDescription;
    toNotExist(): StepDescription;
}
export declare class ElementResult {
    readonly matcher: StepDescription;
    readonly webview: GetWebViewResult;
    constructor(webview: GetWebViewResult, matcher: DetoxWebAtomMatcher, index?: number);
    private static formatIndex;
    getText(): StepDescription;
    tap(): StepDescription;
    replaceText(text: string): StepDescription;
    clearText(): StepDescription;
    getTitle(): StepDescription;
    typeText(text: string): StepDescription;
    getCurrentUrl(): StepDescription;
    runScript(script: string): StepDescription;
    runScriptWithArgs(script: string, args: unknown[]): StepDescription;
    scrollToView(): StepDescription;
}
export {};
