import { StepDescription } from '../../types';
import {
  TestIdMatcherResult,
  TextMatcherResult,
  AccessibilityLabelMatcherResult,
  ShallowAccessibilityLabelMatcherResult,
  ContentDescriptionMatcherResult,
  ToggleableMatcherResult,
  AndMatcherResult,
  OrMatcherResult,
  NotMatcherResult,
  AncestorMatcherResult,
  DescendantMatcherResult,
  ClassMatcherResult,
  VisibilityMatcherResult,
  NotVisibleMatcherResult,
  NullMatcherResult,
  IndexMatcherResult,
  AnythingMatcherResult,
  FocusMatcherResult,
  SliderPositionMatcherResult,
} from './DetoxMatcherResults';

export class DetoxMatcher {
  static matcherForTestId(testId: string, isRegex: boolean): TestIdMatcherResult {
    return new TestIdMatcherResult(testId, isRegex);
  }

  static matcherForText(text: string, isRegex: boolean): TextMatcherResult {
    return new TextMatcherResult(text, isRegex);
  }

  static matcherForAccessibilityLabel(
    label: string,
    isRegex: boolean,
  ): AccessibilityLabelMatcherResult {
    return new AccessibilityLabelMatcherResult(label, isRegex);
  }

  static matcherForShallowAccessibilityLabel(
    label: string,
    isRegex: boolean,
  ): ShallowAccessibilityLabelMatcherResult {
    return new ShallowAccessibilityLabelMatcherResult(label, isRegex);
  }

  static matcherForContentDescription(contentDescription: string): ContentDescriptionMatcherResult {
    return new ContentDescriptionMatcherResult(contentDescription);
  }

  static matcherForToggleable(value: boolean): ToggleableMatcherResult {
    return new ToggleableMatcherResult(value);
  }

  static matcherForAnd(m1: StepDescription, m2: StepDescription): AndMatcherResult {
    return new AndMatcherResult(m1, m2);
  }

  static matcherForOr(m1: StepDescription, m2: StepDescription): OrMatcherResult {
    return new OrMatcherResult(m1, m2);
  }

  static matcherForNot(m: StepDescription): NotMatcherResult {
    return new NotMatcherResult(m);
  }

  static matcherWithAncestor(
    m: StepDescription,
    ancestorMatcher: StepDescription,
  ): AncestorMatcherResult {
    return new AncestorMatcherResult(m, ancestorMatcher);
  }

  static matcherWithDescendant(
    m: StepDescription,
    descendantMatcher: StepDescription,
  ): DescendantMatcherResult {
    return new DescendantMatcherResult(m, descendantMatcher);
  }

  static matcherForClass(className: string): ClassMatcherResult {
    return new ClassMatcherResult(className);
  }

  static matcherForSufficientlyVisible(pct: number): VisibilityMatcherResult {
    return new VisibilityMatcherResult(pct);
  }

  static matcherForNotVisible(): NotVisibleMatcherResult {
    return new NotVisibleMatcherResult();
  }

  static matcherForNotNull(): NullMatcherResult {
    return new NullMatcherResult(false);
  }

  static matcherForNull(): NullMatcherResult {
    return new NullMatcherResult(true);
  }

  static matcherForAtIndex(index: number, innerMatcher: StepDescription): IndexMatcherResult {
    return new IndexMatcherResult(index, innerMatcher);
  }

  static matcherForAnything(): AnythingMatcherResult {
    return new AnythingMatcherResult();
  }

  static matcherForFocus(): FocusMatcherResult {
    return new FocusMatcherResult();
  }

  static matcherForSliderPosition(
    position: number,
    tolerance: number,
  ): SliderPositionMatcherResult {
    return new SliderPositionMatcherResult(position, tolerance);
  }
}
