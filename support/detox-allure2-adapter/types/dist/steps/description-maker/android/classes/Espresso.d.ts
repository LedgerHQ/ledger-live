import { StepDescription, StepDescriptionFriendly } from '../../types';
export declare class Espresso {
    static onView(viewMatcher: StepDescriptionFriendly): OnViewResult;
}
export declare class OnViewResult implements StepDescriptionFriendly {
    private readonly matcher;
    constructor(matcher: StepDescriptionFriendly);
    toJSON(): StepDescription;
}
