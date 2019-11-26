// @flow
import type { App } from "../types/manager";

export type SortOptions = *;

export const sortApps = (apps: App[], _options: SortOptions): App[] => apps;

export type FilterOptions = *;

export const filterApps = (apps: App[], _options: FilterOptions): App[] => apps;
