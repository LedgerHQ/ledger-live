import { StepDescription, StepDescriptionFriendly } from '../../types';
import { concat, msg } from '../../utils';

/**
 * A helper class that wraps two matcher implementations—
 * one for exact matching and one for regex—so that the consumer
 * can simply pass a value and a boolean flag.
 */
class DualMatcherResult implements StepDescriptionFriendly {
  private matcher: StepDescriptionFriendly;
  constructor(
    value: string,
    isRegex: boolean,
    exactFactory: (v: string) => StepDescriptionFriendly,
    regexFactory: (v: string) => StepDescriptionFriendly,
  ) {
    this.matcher = isRegex ? regexFactory(value) : exactFactory(value);
  }
  toJSON(): StepDescription {
    return this.matcher.toJSON();
  }
}

/* -------------------------------------------------------------------------- */
/*                          Base Matcher Classes                              */
/* -------------------------------------------------------------------------- */

// Base class for regex-based matchers
export abstract class RegexMatcher implements StepDescriptionFriendly {
  constructor(
    protected pattern: string,
    // Added "text" to the allowed types for text-based matching.
    protected type: 'id' | 'text' | 'type' | 'a11y-label' | 'shallow-a11y-label' | 'content-desc',
  ) {}

  public toJSON(): StepDescription {
    const typeStr = this.getTypeString();
    return msg(`with ${typeStr} matching /${this.pattern}/`);
  }

  protected getTypeString(): string {
    switch (this.type) {
      case 'a11y-label': {
        return 'accessibility label';
      }
      case 'shallow-a11y-label': {
        return 'shallow accessibility label';
      }
      case 'content-desc': {
        return 'content description';
      }
      case 'text': {
        return 'text';
      }
      default: {
        return this.type;
      }
    }
  }
}

// Base class for exact matchers
export abstract class ExactMatcher implements StepDescriptionFriendly {
  constructor(
    protected value: string,
    protected type: 'id' | 'text' | 'type' | 'a11y-label' | 'shallow-a11y-label' | 'content-desc',
  ) {}

  public toJSON(): StepDescription {
    switch (this.type) {
      case 'id': {
        return msg(`#${this.value}`, { id: this.value });
      }
      case 'text': {
        return msg(JSON.stringify(this.value), { text: this.value });
      }
      case 'type': {
        return msg(`${this.value}`, { type: this.value });
      }
      case 'a11y-label': {
        return msg(`[label=${this.value}]`, { a11y_label: this.value });
      }
      case 'shallow-a11y-label': {
        return msg(`[label=${this.value}]`, { shallow_a11y_label: this.value });
      }
      case 'content-desc': {
        return msg(JSON.stringify(this.value), { content_desc: true });
      }
      default: {
        return msg('?', { type: this.type });
      }
    }
  }
}

// Base class for matchers that combine other matchers
export abstract class CompositeMatcher implements StepDescriptionFriendly {
  constructor(
    protected matchers: StepDescription[],
    protected type: 'and' | 'or' | 'not' | 'with ancestor' | 'with descendant' | 'at index',
    protected extraValue?: number,
  ) {}

  public toJSON(): StepDescription {
    switch (this.type) {
      case 'and': {
        return concat(this.matchers[0], msg('and'), this.matchers[1]);
      }
      case 'or': {
        return concat(this.matchers[0], msg('or'), this.matchers[1]);
      }
      case 'not': {
        return concat(msg('not'), this.matchers[0]);
      }
      case 'with ancestor':
      case 'with descendant': {
        return concat(this.matchers[0], msg(this.type), this.matchers[1]);
      }
      case 'at index': {
        return concat(this.matchers[0], msg(`at index ${this.extraValue}`));
      }
      default: {
        return msg('');
      }
    }
  }
}

// Base class for state-based matchers
export abstract class StateMatcher implements StepDescriptionFriendly {
  constructor(
    protected type:
      | 'toggleable'
      | 'null'
      | 'visible'
      | 'not visible'
      | 'focus'
      | 'class'
      | 'slider'
      | 'anything',
    protected value?: boolean | number | string,
    protected extraValue?: number,
  ) {}

  public toJSON(): StepDescription {
    switch (this.type) {
      case 'toggleable': {
        return msg(`to be ${this.value ? 'checked' : 'unchecked'}`);
      }
      case 'null': {
        return msg(this.value ? 'to be null' : 'not to be null');
      }
      case 'visible': {
        return msg(`to be >=${this.value}% visible`, { amount: this.value });
      }
      case 'not visible': {
        return msg('not to be visible');
      }
      case 'focus': {
        return msg('to be focused');
      }
      case 'class': {
        return msg(`to be of class "${this.value}"`, { class: this.value });
      }
      case 'slider': {
        return msg(`to have slider position ${this.value} (±${this.extraValue})`, {
          position: this.value,
          tolerance: this.extraValue,
        });
      }
      case 'anything': {
        return msg('to match anything');
      }
      default: {
        return msg('');
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                      Concrete Matcher Implementations                    */
/* -------------------------------------------------------------------------- */

// --- For Test IDs ---
class TestIdMatcher extends ExactMatcher {
  constructor(id: string) {
    super(id, 'id');
  }
}
class TestIdRegexMatcher extends RegexMatcher {
  constructor(pattern: string) {
    super(pattern, 'id');
  }
}
export class TestIdMatcherResult extends DualMatcherResult {
  constructor(id: string, isRegex: boolean) {
    super(
      id,
      isRegex,
      (v) => new TestIdMatcher(v),
      (v) => new TestIdRegexMatcher(v),
    );
  }
}

// --- For Text ---
class TextMatcher extends ExactMatcher {
  constructor(text: string) {
    super(text, 'text');
  }
}
class TextRegexMatcher extends RegexMatcher {
  constructor(pattern: string) {
    super(pattern, 'text');
  }
}
export class TextMatcherResult extends DualMatcherResult {
  constructor(text: string, isRegex: boolean) {
    super(
      text,
      isRegex,
      (v) => new TextMatcher(v),
      (v) => new TextRegexMatcher(v),
    );
  }
}

// --- For Accessibility Labels ---
class AccessibilityLabelMatcher extends ExactMatcher {
  constructor(label: string) {
    super(label, 'a11y-label');
  }
}
class AccessibilityLabelRegexMatcher extends RegexMatcher {
  constructor(pattern: string) {
    super(pattern, 'a11y-label');
  }
}
export class AccessibilityLabelMatcherResult extends DualMatcherResult {
  constructor(label: string, isRegex: boolean) {
    super(
      label,
      isRegex,
      (v) => new AccessibilityLabelMatcher(v),
      (v) => new AccessibilityLabelRegexMatcher(v),
    );
  }
}

// --- For Shallow Accessibility Labels ---
class ShallowAccessibilityLabelMatcher extends ExactMatcher {
  constructor(label: string) {
    super(label, 'shallow-a11y-label');
  }
}
class ShallowAccessibilityLabelRegexMatcher extends RegexMatcher {
  constructor(pattern: string) {
    super(pattern, 'shallow-a11y-label');
  }
}
export class ShallowAccessibilityLabelMatcherResult extends DualMatcherResult {
  constructor(label: string, isRegex: boolean) {
    super(
      label,
      isRegex,
      (v) => new ShallowAccessibilityLabelMatcher(v),
      (v) => new ShallowAccessibilityLabelRegexMatcher(v),
    );
  }
}

// --- For Content Descriptions ---
// Note: the consumer method matcherForContentDescription() does not take a regex flag,
// so we assume exact matching.
class ContentDescriptionMatcher extends ExactMatcher {
  constructor(description: string) {
    super(description, 'content-desc');
  }
}
class ContentDescriptionRegexMatcher extends RegexMatcher {
  constructor(pattern: string) {
    super(pattern, 'content-desc');
  }
}
export class ContentDescriptionMatcherResult extends DualMatcherResult {
  constructor(description: string, isRegex: boolean = false) {
    super(
      description,
      isRegex,
      (v) => new ContentDescriptionMatcher(v),
      (v) => new ContentDescriptionRegexMatcher(v),
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                          Composite Matchers                                */
/* -------------------------------------------------------------------------- */
export class AndMatcherResult extends CompositeMatcher {
  constructor(matcher1: StepDescription, matcher2: StepDescription) {
    super([matcher1, matcher2], 'and');
  }
}
export class OrMatcherResult extends CompositeMatcher {
  constructor(matcher1: StepDescription, matcher2: StepDescription) {
    super([matcher1, matcher2], 'or');
  }
}
export class NotMatcherResult extends CompositeMatcher {
  constructor(matcher: StepDescription) {
    super([matcher], 'not');
  }
}
export class AncestorMatcherResult extends CompositeMatcher {
  constructor(matcher: StepDescription, ancestorMatcher: StepDescription) {
    super([matcher, ancestorMatcher], 'with ancestor');
  }
}
export class DescendantMatcherResult extends CompositeMatcher {
  constructor(matcher: StepDescription, descendantMatcher: StepDescription) {
    super([matcher, descendantMatcher], 'with descendant');
  }
}
export class IndexMatcherResult extends CompositeMatcher {
  constructor(index: number, innerMatcher: StepDescription) {
    super([innerMatcher], 'at index', index);
  }
}

/* -------------------------------------------------------------------------- */
/*                           State Matchers                                   */
/* -------------------------------------------------------------------------- */
export class ToggleableMatcherResult extends StateMatcher {
  constructor(value: boolean) {
    super('toggleable', value);
  }
}
export class NullMatcherResult extends StateMatcher {
  constructor(isNull: boolean) {
    super('null', isNull);
  }
}
export class VisibilityMatcherResult extends StateMatcher {
  constructor(percentVisible: number) {
    super('visible', percentVisible);
  }
}
export class NotVisibleMatcherResult extends StateMatcher {
  constructor() {
    super('not visible');
  }
}
export class FocusMatcherResult extends StateMatcher {
  constructor() {
    super('focus');
  }
}
export class ClassMatcherResult extends StateMatcher {
  constructor(className: string) {
    super('class', className);
  }
}
export class AnythingMatcherResult extends StateMatcher {
  constructor() {
    super('anything');
  }
}
export class SliderPositionMatcherResult extends StateMatcher {
  constructor(position: number, tolerance: number) {
    super('slider', position, tolerance);
  }
}
