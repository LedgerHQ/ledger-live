import type { StepDescription } from '../../types';
import type { ExpectationInvocation, Invocation } from '../detox-payload';
export declare const formatWhileCondition: (expectation?: ExpectationInvocation) => StepDescription | null;
export declare const formatExpectation: (invocation: Invocation) => StepDescription | null;
