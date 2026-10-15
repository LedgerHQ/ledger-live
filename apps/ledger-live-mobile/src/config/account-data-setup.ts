import type { AccountDataSource } from "@domain/api-account-data-source";

/** The app's account data sources, in rank order: for each account, the first that serves it answers. */
export const accountDataSources: readonly AccountDataSource[] = [];
