import type { StepDescription } from '../../types';
import type { WebExpectationInvocation, WebInvocation, WebPredicate } from '../detox-payload';
export declare function formatWebPredicate(predicate: WebPredicate | undefined, atIndex: number | undefined, prefix?: string): StepDescription;
export declare const formatWebAction: (invocation: WebInvocation) => StepDescription | null;
export declare const formatWebExpectation: (invocation: WebExpectationInvocation) => StepDescription | null;
