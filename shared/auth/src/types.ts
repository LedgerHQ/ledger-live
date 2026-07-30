import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from "@reduxjs/toolkit/query";
import { z } from "zod";

export type AuthenticatedBaseQueryExtraOptions = {
  authenticated?: boolean;
  refreshAndRetryWhen?: (
    result: QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>,
  ) => boolean;
};

export type AuthToken = {
  accessToken: string;
  tokenType: string;
};

export type WithTokenOptions<T> = {
  queryFn: (token?: AuthToken) => Promise<T>;
  refreshAndRetryWhen?: (result: T) => boolean;
};

export type AuthProvider = {
  withToken<T>(options: WithTokenOptions<T>): Promise<T>;
};

const AuthProviderSchema = z.custom<AuthProvider>(
  value =>
    typeof value === "object" &&
    value !== null &&
    "withToken" in value &&
    typeof value.withToken === "function",
);
export const AuthenticatedBaseQueryExtraSchema = z.object({
  authProvider: AuthProviderSchema,
});
