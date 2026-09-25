import { StepDescription } from '../../types';
import { TestIdMatcherResult, TextMatcherResult, AccessibilityLabelMatcherResult, ShallowAccessibilityLabelMatcherResult, ContentDescriptionMatcherResult, ToggleableMatcherResult, AndMatcherResult, OrMatcherResult, NotMatcherResult, AncestorMatcherResult, DescendantMatcherResult, ClassMatcherResult, VisibilityMatcherResult, NotVisibleMatcherResult, NullMatcherResult, IndexMatcherResult, AnythingMatcherResult, FocusMatcherResult, SliderPositionMatcherResult } from './DetoxMatcherResults';
export declare class DetoxMatcher {
    static matcherForTestId(testId: string, isRegex: boolean): TestIdMatcherResult;
    static matcherForText(text: string, isRegex: boolean): TextMatcherResult;
    static matcherForAccessibilityLabel(label: string, isRegex: boolean): AccessibilityLabelMatcherResult;
    static matcherForShallowAccessibilityLabel(label: string, isRegex: boolean): ShallowAccessibilityLabelMatcherResult;
    static matcherForContentDescription(contentDescription: string): ContentDescriptionMatcherResult;
    static matcherForToggleable(value: boolean): ToggleableMatcherResult;
    static matcherForAnd(m1: StepDescription, m2: StepDescription): AndMatcherResult;
    static matcherForOr(m1: StepDescription, m2: StepDescription): OrMatcherResult;
    static matcherForNot(m: StepDescription): NotMatcherResult;
    static matcherWithAncestor(m: StepDescription, ancestorMatcher: StepDescription): AncestorMatcherResult;
    static matcherWithDescendant(m: StepDescription, descendantMatcher: StepDescription): DescendantMatcherResult;
    static matcherForClass(className: string): ClassMatcherResult;
    static matcherForSufficientlyVisible(pct: number): VisibilityMatcherResult;
    static matcherForNotVisible(): NotVisibleMatcherResult;
    static matcherForNotNull(): NullMatcherResult;
    static matcherForNull(): NullMatcherResult;
    static matcherForAtIndex(index: number, innerMatcher: StepDescription): IndexMatcherResult;
    static matcherForAnything(): AnythingMatcherResult;
    static matcherForFocus(): FocusMatcherResult;
    static matcherForSliderPosition(position: number, tolerance: number): SliderPositionMatcherResult;
}
