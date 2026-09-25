import { StepDescription, StepDescriptionFriendly } from '../../types';
import { msg } from '../../utils';
import type { ArgumentFormatter } from '../core';

export class EspressoDetox {
  static getViewMatcher(matcher: StepDescriptionFriendly): StepDescriptionFriendly {
    return matcher;
  }

  static getViewInteraction(matcher: StepDescriptionFriendly): StepDescriptionFriendly {
    return matcher;
  }

  static perform(
    viewInteraction: StepDescriptionFriendly,
    viewAction: ArgumentFormatter,
  ): StepDescription | null {
    return viewAction && viewInteraction ? viewAction.format(viewInteraction) : null;
  }

  static check(
    viewInteraction: StepDescriptionFriendly,
    viewAssertion: ArgumentFormatter,
  ): StepDescription | null {
    return viewAssertion && viewInteraction ? viewAssertion.format?.(viewInteraction) : null;
  }

  static performAction(
    element: StepDescriptionFriendly,
    action: ArgumentFormatter,
  ): StepDescription | null {
    return action && element ? action.format?.(element) : null;
  }

  static changeOrientation(orientation: string): StepDescription {
    return msg(`Change orientation to ${orientation}`, { orientation });
  }

  static setSynchronization(enabled: boolean): StepDescription {
    return msg(`Set synchronization ${enabled ? 'enabled' : 'disabled'}`, { enabled });
  }

  static setURLBlacklist(urls: string[]): StepDescription {
    return msg('Set URL blacklist', { urls });
  }

  static tap(x: number, y: number, shouldIgnoreStatusBar: boolean): StepDescription {
    return msg(`Tap at (${x}, ${y})`, { x, y, ignore_status_bar: shouldIgnoreStatusBar });
  }

  static longPress(
    x: number,
    y: number,
    shouldIgnoreStatusBar: boolean,
    duration?: number,
  ): StepDescription {
    return msg(`Long press at (${x}, ${y})`, {
      x,
      y,
      ignore_status_bar: shouldIgnoreStatusBar,
      duration,
    });
  }
}
