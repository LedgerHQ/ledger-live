import { StepDescription, StepDescriptionFriendly } from '../../types';
import { concat, msg } from '../../utils';
import type { ArgumentFormatter } from '../core';

// ViewActions class implementation
export class ViewActions {
  static clearText(): ClearTextResult {
    return new ClearTextResult();
  }

  static pressKey(keyCode: number): PressKeyResult {
    return new PressKeyResult(keyCode);
  }

  static replaceText(stringToBeSet: string): ReplaceTextResult {
    return new ReplaceTextResult(stringToBeSet);
  }

  static clearGlobalAssertions(): ClearGlobalAssertionsResult {
    return new ClearGlobalAssertionsResult();
  }

  static actionWithAssertions(viewAction: ArgumentFormatter): ActionWithAssertionsResult {
    return new ActionWithAssertionsResult(viewAction);
  }

  static click(inputDevice?: string, buttonState?: string): ClickResult {
    return new ClickResult(inputDevice, buttonState);
  }

  static swipeLeft(): SwipeResult {
    return new SwipeResult('left');
  }

  static swipeRight(): SwipeResult {
    return new SwipeResult('right');
  }

  static swipeDown(): SwipeResult {
    return new SwipeResult('down');
  }

  static swipeUp(): SwipeResult {
    return new SwipeResult('up');
  }

  static closeSoftKeyboard(): KeyboardActionResult {
    return new KeyboardActionResult('Close soft keyboard');
  }

  static pressImeActionButton(): KeyboardActionResult {
    return new KeyboardActionResult('Press IME action button');
  }

  static pressBack(): KeyboardActionResult {
    return new KeyboardActionResult('Press back');
  }

  static pressBackUnconditionally(): KeyboardActionResult {
    return new KeyboardActionResult('Press back unconditionally');
  }

  static pressMenuKey(): KeyboardActionResult {
    return new KeyboardActionResult('Press menu key');
  }

  static doubleClick(): DoubleClickResult {
    return new DoubleClickResult();
  }

  static longClick(duration?: number): LongClickResult {
    return new LongClickResult(duration);
  }

  static scrollTo(direction?: string): ScrollToResult {
    return new ScrollToResult(direction);
  }

  static typeTextIntoFocusedView(stringToBeTyped: string): TypeTextResult {
    return new TypeTextResult(stringToBeTyped, true);
  }

  static typeText(stringToBeTyped: string): TypeTextResult {
    return new TypeTextResult(stringToBeTyped);
  }

  static openLinkWithText(linkText: string): OpenLinkResult {
    return new OpenLinkResult('text', linkText);
  }

  static openLinkWithUri(uri: string): OpenLinkResult {
    return new OpenLinkResult('uri', uri);
  }

  static repeatedlyUntil(
    action: ArgumentFormatter,
    desiredStateMatcher: StepDescriptionFriendly,
    maxAttempts: number,
  ): RepeatedlyUntilResult {
    return new RepeatedlyUntilResult(action, desiredStateMatcher, maxAttempts);
  }

  static swipe(direction: string, speed?: string): SwipeResult {
    return new SwipeResult(direction, speed);
  }
}

// Result classes for all actions
export class ClearTextResult implements ArgumentFormatter {
  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat('Clear text on', matcher);
  }
}

export class PressKeyResult implements ArgumentFormatter {
  constructor(private readonly keyCode: number) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(msg(`Press key ${this.keyCode}`, { key_code: this.keyCode }), 'on', matcher);
  }
}

export class ReplaceTextResult implements ArgumentFormatter {
  constructor(private readonly text: string) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(msg(`Replace text with "${this.text}"`, { text: this.text }), 'on', matcher);
  }
}

export class ClearGlobalAssertionsResult implements ArgumentFormatter {
  format(): StepDescription {
    return msg('Clear global assertions');
  }
}

export class ActionWithAssertionsResult implements ArgumentFormatter {
  constructor(private readonly action: ArgumentFormatter) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return this.action.format(matcher);
  }
}

export class ClickResult implements ArgumentFormatter {
  constructor(
    private readonly inputDevice?: string,
    private readonly buttonState?: string,
  ) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(
      msg('Click', { input_device: this.inputDevice, button_state: this.buttonState }),
      'on',
      matcher,
    );
  }
}

export class SwipeResult implements ArgumentFormatter {
  constructor(
    private readonly direction: string,
    private readonly speed?: string,
  ) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(
      msg(`Swipe ${this.direction}`, { direction: this.direction, speed: this.speed }),
      'on',
      matcher,
    );
  }
}

export class KeyboardActionResult implements ArgumentFormatter {
  constructor(private readonly action: string) {}

  format(): StepDescription {
    return msg(this.action);
  }
}

export class DoubleClickResult implements ArgumentFormatter {
  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat('Double click on', matcher);
  }
}

export class LongClickResult implements ArgumentFormatter {
  constructor(private readonly duration?: number) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(msg('Long click', { duration: this.duration }), 'on', matcher);
  }
}

export class ScrollToResult implements ArgumentFormatter {
  constructor(private readonly direction?: string) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(msg('Scroll to', { direction: this.direction }), matcher);
  }
}

export class TypeTextResult implements ArgumentFormatter {
  constructor(
    private readonly text: string,
    private readonly isFocused: boolean = false,
  ) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(
      'Type',
      msg('text', { text: this.text }),
      this.isFocused ? 'into focused' : 'into',
      matcher,
    );
  }
}

export class OpenLinkResult implements ArgumentFormatter {
  constructor(
    private readonly type: 'text' | 'uri',
    private readonly value: string,
  ) {}

  format(): StepDescription {
    const param = this.type === 'text' ? { text: this.value } : { uri: this.value };
    return msg(`Open link with ${this.type} "${this.value}"`, param);
  }
}

export class RepeatedlyUntilResult implements ArgumentFormatter {
  constructor(
    private readonly action: ArgumentFormatter,
    private readonly desiredStateMatcher: StepDescriptionFriendly,
    private readonly maxAttempts: number,
  ) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(
      'Repeatedly',
      this.action.format(matcher),
      'until',
      this.desiredStateMatcher,
      msg(`(max ${this.maxAttempts} attempts)`, { max_attempts: this.maxAttempts }),
    );
  }
}
