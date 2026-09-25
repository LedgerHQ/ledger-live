export interface StepDescription {
  readonly message?: string;
  readonly args?: StepArgs;
}

export type StepArgs = Record<string, any> | null | undefined;

export type StepDescriptionMaker = (payload: unknown) => StepDescription | null;

export interface StepDescriptionFriendly {
  toJSON(): StepDescription;
}

export type StepDescriptionLike = string | StepDescriptionFriendly | StepDescription;
