import { StepDescription, StepDescriptionFriendly } from '../../types';
declare class DualMatcherResult implements StepDescriptionFriendly {
    private matcher;
    constructor(value: string, isRegex: boolean, exactFactory: (v: string) => StepDescriptionFriendly, regexFactory: (v: string) => StepDescriptionFriendly);
    toJSON(): StepDescription;
}
export declare abstract class RegexMatcher implements StepDescriptionFriendly {
    protected pattern: string;
    protected type: 'id' | 'text' | 'type' | 'a11y-label' | 'shallow-a11y-label' | 'content-desc';
    constructor(pattern: string, type: 'id' | 'text' | 'type' | 'a11y-label' | 'shallow-a11y-label' | 'content-desc');
    toJSON(): StepDescription;
    protected getTypeString(): string;
}
export declare abstract class ExactMatcher implements StepDescriptionFriendly {
    protected value: string;
    protected type: 'id' | 'text' | 'type' | 'a11y-label' | 'shallow-a11y-label' | 'content-desc';
    constructor(value: string, type: 'id' | 'text' | 'type' | 'a11y-label' | 'shallow-a11y-label' | 'content-desc');
    toJSON(): StepDescription;
}
export declare abstract class CompositeMatcher implements StepDescriptionFriendly {
    protected matchers: StepDescription[];
    protected type: 'and' | 'or' | 'not' | 'with ancestor' | 'with descendant' | 'at index';
    protected extraValue?: number | undefined;
    constructor(matchers: StepDescription[], type: 'and' | 'or' | 'not' | 'with ancestor' | 'with descendant' | 'at index', extraValue?: number | undefined);
    toJSON(): StepDescription;
}
export declare abstract class StateMatcher implements StepDescriptionFriendly {
    protected type: 'toggleable' | 'null' | 'visible' | 'not visible' | 'focus' | 'class' | 'slider' | 'anything';
    protected value?: string | number | boolean | undefined;
    protected extraValue?: number | undefined;
    constructor(type: 'toggleable' | 'null' | 'visible' | 'not visible' | 'focus' | 'class' | 'slider' | 'anything', value?: string | number | boolean | undefined, extraValue?: number | undefined);
    toJSON(): StepDescription;
}
export declare class TestIdMatcherResult extends DualMatcherResult {
    constructor(id: string, isRegex: boolean);
}
export declare class TextMatcherResult extends DualMatcherResult {
    constructor(text: string, isRegex: boolean);
}
export declare class AccessibilityLabelMatcherResult extends DualMatcherResult {
    constructor(label: string, isRegex: boolean);
}
export declare class ShallowAccessibilityLabelMatcherResult extends DualMatcherResult {
    constructor(label: string, isRegex: boolean);
}
export declare class ContentDescriptionMatcherResult extends DualMatcherResult {
    constructor(description: string, isRegex?: boolean);
}
export declare class AndMatcherResult extends CompositeMatcher {
    constructor(matcher1: StepDescription, matcher2: StepDescription);
}
export declare class OrMatcherResult extends CompositeMatcher {
    constructor(matcher1: StepDescription, matcher2: StepDescription);
}
export declare class NotMatcherResult extends CompositeMatcher {
    constructor(matcher: StepDescription);
}
export declare class AncestorMatcherResult extends CompositeMatcher {
    constructor(matcher: StepDescription, ancestorMatcher: StepDescription);
}
export declare class DescendantMatcherResult extends CompositeMatcher {
    constructor(matcher: StepDescription, descendantMatcher: StepDescription);
}
export declare class IndexMatcherResult extends CompositeMatcher {
    constructor(index: number, innerMatcher: StepDescription);
}
export declare class ToggleableMatcherResult extends StateMatcher {
    constructor(value: boolean);
}
export declare class NullMatcherResult extends StateMatcher {
    constructor(isNull: boolean);
}
export declare class VisibilityMatcherResult extends StateMatcher {
    constructor(percentVisible: number);
}
export declare class NotVisibleMatcherResult extends StateMatcher {
    constructor();
}
export declare class FocusMatcherResult extends StateMatcher {
    constructor();
}
export declare class ClassMatcherResult extends StateMatcher {
    constructor(className: string);
}
export declare class AnythingMatcherResult extends StateMatcher {
    constructor();
}
export declare class SliderPositionMatcherResult extends StateMatcher {
    constructor(position: number, tolerance: number);
}
export {};
