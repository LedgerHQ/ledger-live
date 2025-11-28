import { Maybe } from "./helpers";

export type User = {
  // segment user id
  id: string;
  // datadog user id (used in datadog)
  datadogId: string;
};

export type MaybeUser = Maybe<User>;
