import { StepDescription, StepDescriptionFriendly } from '../../types';

export interface ArgumentFormatter {
  format(arg1: StepDescriptionFriendly): StepDescription;
}

export interface ArgumentFormatter2 {
  format(arg1: StepDescriptionFriendly, arg2: StepDescriptionFriendly): StepDescription;
}
