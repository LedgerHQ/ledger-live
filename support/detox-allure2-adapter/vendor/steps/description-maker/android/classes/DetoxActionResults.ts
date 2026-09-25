import { StepDescription, StepDescriptionFriendly } from '../../types';
import { concat, msg } from '../../utils';
import type { ArgumentFormatter } from '../core';

export class AccessibilityActionResult implements ArgumentFormatter {
  constructor(private readonly actionName: string) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(
      msg(`Activate accessibility action "${this.actionName}"`, { action: this.actionName }),
      'on',
      matcher,
    );
  }
}

export class AdjustSliderToPositionResult implements ArgumentFormatter {
  constructor(private readonly position: number) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(
      'Adjust slider',
      matcher,
      msg(`to position ${this.position}`, { position: this.position }),
    );
  }
}

export class GetAttributesResult implements ArgumentFormatter {
  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat('Get attributes of', matcher);
  }
}

export class LongPressResult implements ArgumentFormatter {
  constructor(
    private readonly x?: number,
    private readonly y?: number,
    private readonly duration?: number,
  ) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    const point =
      this.x != null || this.y != null
        ? msg(`at (${this.x}, ${this.y})`, { x: this.x, y: this.y })
        : null;

    return concat(msg('Long press', { duration: this.duration }), point, 'on', matcher);
  }
}

export class ScrollInDirectionResult implements ArgumentFormatter {
  private static readonly DIRECTIONS = ['left', 'right', 'up', 'down'];
  private readonly direction: string;

  constructor(
    direction: string | number,
    private readonly amountInDP: number,
    private readonly startOffsetPercentX: number,
    private readonly startOffsetPercentY: number,
  ) {
    this.direction =
      typeof direction === 'string' ? direction : ScrollInDirectionResult.DIRECTIONS[direction - 1];
  }

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(
      msg(`Scroll ${this.direction}`, {
        direction: this.direction,
        amount: this.amountInDP,
        start_x: this.startOffsetPercentX,
        start_y: this.startOffsetPercentY,
      }),
      'on',
      matcher,
    );
  }
}

export class ScrollInDirectionStaleAtEdgeResult implements ArgumentFormatter {
  private static readonly DIRECTIONS = ['left', 'right', 'top', 'bottom'];
  private readonly direction: string;

  constructor(
    direction: number,
    private readonly amountInDP: number,
    private readonly startOffsetPercentX: number,
    private readonly startOffsetPercentY: number,
  ) {
    this.direction = ScrollInDirectionStaleAtEdgeResult.DIRECTIONS[direction - 1];
  }

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(
      msg(`Scroll ${this.direction} until stale at edge`, {
        direction: this.direction,
        amount: this.amountInDP,
        start_x: this.startOffsetPercentX,
        start_y: this.startOffsetPercentY,
      }),
      'on',
      matcher,
    );
  }
}

export class ScrollToEdgeResult implements ArgumentFormatter {
  constructor(
    private readonly edge: number,
    private readonly startOffsetPercentX: number,
    private readonly startOffsetPercentY: number,
  ) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    const edgeDescription = this.edge === 1 ? 'bottom' : 'top';
    return concat(
      msg(`Scroll to ${edgeDescription}`, {
        edge: this.edge,
        start_x: this.startOffsetPercentX,
        start_y: this.startOffsetPercentY,
      }),
      'on',
      matcher,
    );
  }
}

export class ScrollToIndexResult implements ArgumentFormatter {
  constructor(private readonly index: number) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(msg(`Scroll to index ${this.index}`, { index: this.index }), 'on', matcher);
  }
}

export class SetDatePickerDateResult implements ArgumentFormatter {
  constructor(
    private readonly dateString: string,
    private readonly formatString: string,
  ) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(
      msg(`Set date to "${this.dateString}"`, {
        date: this.dateString,
        format: this.formatString,
      }),
      'on',
      matcher,
    );
  }
}

export class SwipeInDirectionResult implements ArgumentFormatter {
  constructor(
    private readonly direction: string,
    private readonly fast: boolean,
    private readonly normalizedOffset: number,
    private readonly normalizedStartingPointX: number,
    private readonly normalizedStartingPointY: number,
  ) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(
      msg(`Swipe ${this.direction}${this.fast ? ' fast' : ''}`, {
        direction: this.direction,
        fast: this.fast,
        offset: this.normalizedOffset,
        start_x: this.normalizedStartingPointX,
        start_y: this.normalizedStartingPointY,
      }),
      'on',
      matcher,
    );
  }
}

export class TakeViewScreenshotResult implements ArgumentFormatter {
  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(msg('Take screenshot of', { screenshot_name: 'element' }), matcher);
  }
}

export class MultiClickResult implements ArgumentFormatter {
  constructor(private readonly times: number) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(msg(`Tap ${this.times} times`, { times: this.times }), 'on', matcher);
  }
}

export class TapAtLocationResult implements ArgumentFormatter {
  constructor(
    private readonly x: number,
    private readonly y: number,
  ) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(msg(`Tap at (${this.x}, ${this.y})`, { x: this.x, y: this.y }), 'on', matcher);
  }
}

export class LongPressAndDragResult implements ArgumentFormatter {
  constructor(
    private readonly duration: number,
    private readonly normalizedPositionX: number,
    private readonly normalizedPositionY: number,
    private readonly targetElement: StepDescriptionFriendly,
    private readonly normalizedTargetPositionX: number,
    private readonly normalizedTargetPositionY: number,
    private readonly isFast: boolean,
    private readonly holdDuration: number,
  ) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    return concat(
      msg(`Long press for ${this.duration}ms`, {
        duration: this.duration,
        start_x: this.normalizedPositionX,
        start_y: this.normalizedPositionY,
        fast: this.isFast,
        hold_duration: this.holdDuration,
      }),
      'on',
      matcher,
      'and drag to',
      this.targetElement,
      msg(`at (${this.normalizedTargetPositionX}, ${this.normalizedTargetPositionY})`, {
        target_x: this.normalizedTargetPositionX,
        target_y: this.normalizedTargetPositionY,
      }),
    );
  }
}
