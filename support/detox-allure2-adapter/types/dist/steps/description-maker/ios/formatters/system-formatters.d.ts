import type { StepDescription } from '../../types';
import type { SystemExpectationMessage, SystemActionMessage } from '../detox-payload';
export declare const formatSystemAction: (invocation: SystemActionMessage) => StepDescription | null;
export declare const formatSystemExpectation: (invocation: SystemExpectationMessage) => StepDescription | null;
