import type { StepDescription, StepDescriptionFriendly } from '../../types';
type DetoxWebAtomMatcherKind = 'id' | 'class' | 'css' | 'name' | 'xpath' | 'linkText' | 'partialLinkText' | 'tag';
export declare class DetoxWebAtomMatcher implements StepDescriptionFriendly {
    private readonly kind;
    private readonly value;
    constructor(kind: DetoxWebAtomMatcherKind, value: string);
    static matcherForId(id: string): DetoxWebAtomMatcher;
    static matcherForClassName(className: string): DetoxWebAtomMatcher;
    static matcherForCssSelector(cssSelector: string): DetoxWebAtomMatcher;
    static matcherForName(name: string): DetoxWebAtomMatcher;
    static matcherForXPath(xpath: string): DetoxWebAtomMatcher;
    static matcherForLinkText(linkText: string): DetoxWebAtomMatcher;
    static matcherForPartialLinkText(partialLinkText: string): DetoxWebAtomMatcher;
    static matcherForTagName(tag: string): DetoxWebAtomMatcher;
    toJSON(): StepDescription;
}
export {};
