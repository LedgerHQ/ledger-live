import { StepDescription, StepDescriptionFriendly } from '../../types';
import {
  DetoxMessage,
  ClassObject,
  InvocationObject,
  BooleanObject,
  IntegerObject,
  DoubleObject,
} from './detox-payload';

/**
 * Type guard for DetoxMessage
 * Part of the semantic analysis phase of the pseudo-compiler.
 */
export function isDetoxMessage(payload: unknown): payload is DetoxMessage {
  return (
    payload !== null &&
    typeof payload === 'object' &&
    'type' in payload &&
    typeof payload.type === 'string'
  );
}

/**
 * Type guard for ClassObject
 * Part of the semantic analysis phase of the pseudo-compiler.
 */
export function isClassObject(node: unknown): node is ClassObject {
  return (
    node !== null &&
    typeof node === 'object' &&
    'type' in node &&
    node.type === 'Class' &&
    'value' in node &&
    typeof node.value === 'string'
  );
}

/**
 * Type guard for InvocationObject
 * Part of the semantic analysis phase of the pseudo-compiler.
 */
export function isInvocationObject(node: unknown): node is InvocationObject {
  return (
    node !== null &&
    typeof node === 'object' &&
    'type' in node &&
    node.type === 'Invocation' &&
    'value' in node &&
    typeof node.value === 'object'
  );
}

/**
 * Type guard for primitive type objects (Boolean, Integer, Double)
 * Part of the semantic analysis phase of the pseudo-compiler.
 */
export function isPrimitiveTypeObject(
  node: unknown,
): node is BooleanObject | IntegerObject | DoubleObject {
  return (
    node !== null &&
    typeof node === 'object' &&
    'type' in node &&
    (node.type === 'Boolean' ||
      node.type === 'boolean' ||
      node.type === 'Integer' ||
      node.type === 'integer' ||
      node.type === 'Float' ||
      node.type === 'float' ||
      node.type === 'Double' ||
      node.type === 'double') &&
    'value' in node
  );
}

/**
 * Type guard for StepDescription
 * Part of the semantic analysis phase of the pseudo-compiler.
 */
export function isStepDescription(obj: unknown): obj is StepDescription {
  return (
    obj !== null && typeof obj === 'object' && 'message' in obj && typeof obj.message === 'string'
  );
}

export function isStepDescriptionFriendly(obj: unknown): obj is StepDescriptionFriendly {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'toJSON' in obj &&
    typeof (obj as any).toJSON === 'function'
  );
}
