import { StepDescription, StepDescriptionFriendly } from '../../types';

export class Espresso {
  static onView(viewMatcher: StepDescriptionFriendly): OnViewResult {
    return new OnViewResult(viewMatcher);
  }
}

export class OnViewResult implements StepDescriptionFriendly {
  constructor(private readonly matcher: StepDescriptionFriendly) {}

  toJSON(): StepDescription {
    return this.matcher.toJSON();
  }
}
