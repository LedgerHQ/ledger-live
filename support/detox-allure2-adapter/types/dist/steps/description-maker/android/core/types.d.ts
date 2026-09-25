import { StepDescription } from '../../types';
export type DescriptionMethod = (...args: unknown[]) => StepDescription | null;
export interface ClassImplementation {
    [methodName: string]: DescriptionMethod;
}
export interface CallFrame {
    className: string;
    methodName: string;
    args: unknown[];
}
