import { StepDescription, StepDescriptionFriendly } from '../../types';
import { DetoxMessage, ClassObject, InvocationObject, BooleanObject, IntegerObject, DoubleObject } from './detox-payload';
export declare function isDetoxMessage(payload: unknown): payload is DetoxMessage;
export declare function isClassObject(node: unknown): node is ClassObject;
export declare function isInvocationObject(node: unknown): node is InvocationObject;
export declare function isPrimitiveTypeObject(node: unknown): node is BooleanObject | IntegerObject | DoubleObject;
export declare function isStepDescription(obj: unknown): obj is StepDescription;
export declare function isStepDescriptionFriendly(obj: unknown): obj is StepDescriptionFriendly;
