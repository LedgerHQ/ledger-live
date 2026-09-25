import { StepDescription, StepDescriptionFriendly } from '../../types';
import type { StateMatcher } from './DetoxMatcherResults';
export declare class DetoxAssertion {
    static assertMatcher(viewInteraction: StepDescriptionFriendly, viewMatcher: StateMatcher): StepDescription;
    static assertNotVisible(viewInteraction: StepDescriptionFriendly): StepDescription;
    static assertNotExists(viewInteraction: StepDescriptionFriendly): StepDescription;
    static waitForAssertMatcher(viewInteraction: StepDescriptionFriendly, viewMatcher: StepDescriptionFriendly, timeoutSeconds: number): StepDescription;
    static waitForAssertMatcherWithSearchAction(viewInteraction: StepDescriptionFriendly, viewMatcher: StepDescriptionFriendly, searchAction: StepDescriptionFriendly, searchMatcher: StepDescriptionFriendly): StepDescription;
}
