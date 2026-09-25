import { StepDescription, StepDescriptionFriendly } from '../../types';
import { concat, msg } from '../../utils';
import type { StateMatcher } from './DetoxMatcherResults';

export class DetoxAssertion {
  static assertMatcher(
    viewInteraction: StepDescriptionFriendly,
    viewMatcher: StateMatcher,
  ): StepDescription {
    return concat('Expect', viewInteraction, viewMatcher);
  }

  static assertNotVisible(viewInteraction: StepDescriptionFriendly): StepDescription {
    return concat('Expect', viewInteraction, 'to not be visible');
  }

  static assertNotExists(viewInteraction: StepDescriptionFriendly): StepDescription {
    return concat('Expect', viewInteraction, 'to not exist');
  }

  static waitForAssertMatcher(
    viewInteraction: StepDescriptionFriendly,
    viewMatcher: StepDescriptionFriendly,
    timeoutSeconds: number,
  ): StepDescription {
    return concat(
      'Wait up to',
      msg(`${timeoutSeconds} seconds`, { timeout: timeoutSeconds }),
      'and expect',
      viewInteraction,
      'to match condition:',
      viewMatcher,
    );
  }

  static waitForAssertMatcherWithSearchAction(
    viewInteraction: StepDescriptionFriendly,
    viewMatcher: StepDescriptionFriendly,
    searchAction: StepDescriptionFriendly,
    searchMatcher: StepDescriptionFriendly,
  ): StepDescription {
    return concat(
      'Expect',
      viewInteraction,
      'to match condition:',
      viewMatcher,
      'while',
      searchAction,
      'on',
      searchMatcher,
    );
  }
}
