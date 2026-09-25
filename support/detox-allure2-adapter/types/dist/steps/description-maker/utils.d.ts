import type { StepDescription, StepArgs, StepDescriptionLike } from './types';
export declare function concat(...results: (StepDescriptionLike | null)[]): StepDescription;
export declare function glue(...results: (StepDescriptionLike | null)[]): StepDescription;
export declare function msg(message?: string, args?: StepArgs): StepDescription;
export declare function percent(value?: unknown): string;
export declare function percentVisible(value?: unknown): string;
export declare function truncate(value?: unknown, maxLength?: number): string;
