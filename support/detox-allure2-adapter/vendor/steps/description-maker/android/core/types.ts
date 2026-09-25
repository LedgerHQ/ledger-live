import { StepDescription } from '../../types';

/**
 * Type for a method in a class implementation that returns a StepDescription.
 */
export type DescriptionMethod = (...args: unknown[]) => StepDescription | null;

/**
 * Interface for a class in the registry.
 */
export interface ClassImplementation {
  [methodName: string]: DescriptionMethod;
}

/**
 * Represents a call frame in the execution stack.
 * Each frame contains information about a method call in the invocation tree.
 */
export interface CallFrame {
  className: string;
  methodName: string;
  args: unknown[];
}
