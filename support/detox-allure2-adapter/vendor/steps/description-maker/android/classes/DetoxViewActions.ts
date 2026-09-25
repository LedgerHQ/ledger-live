import { StepDescription, StepDescriptionFriendly } from '../../types';
import { concat, msg } from '../../utils';
import type { ArgumentFormatter } from '../core';

export class DetoxViewActions {
  static click(): ViewActionResult {
    return new ViewActionResult('Click on');
  }

  static typeText(text: string): ViewActionResult {
    return new ViewActionResult('Type text in', { text });
  }
}

export class ViewActionResult implements ArgumentFormatter {
  constructor(
    private readonly actionName: string,
    private readonly params?: Record<string, any>,
  ) {}

  format(matcher: StepDescriptionFriendly): StepDescription {
    const baseMsg = msg(this.actionName, this.params);
    return concat(baseMsg, matcher);
  }
}
