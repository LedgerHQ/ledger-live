import { StepDescription, StepDescriptionLike } from '../../types';
import { msg } from '../../utils';
import { classRegistry } from '../classes';
import type { ClassObject, InvocationValue } from './detox-payload';
import {
  isClassObject,
  isDetoxMessage,
  isInvocationObject,
  isPrimitiveTypeObject,
  isStepDescription,
  isStepDescriptionFriendly,
} from './type-guards';
import { ClassImplementation } from './types';

/**
 * Main processor class for Android Description Maker.
 * Implements the pseudo-compiler pattern to process invocation trees.
 *
 * This class acts as a pseudo-compiler with the following phases:
 *
 * 1. Lexical Analysis (Implicit): The input is already structured as a JSON object
 * 2. Parsing (Implicit): The JSON structure represents the parse tree
 * 3. Semantic Analysis: Type checking and validation of the invocation tree
 * 4. Code Generation: Transformation of invocations into human-readable descriptions
 *
 * The processor uses the Visitor Pattern to traverse the invocation tree and
 * delegate processing to appropriate methods based on node types.
 */
export class AndroidDescriptionProcessor {
  /**
   * Processes a payload and returns a step description.
   * This is the main entry point for the processor.
   *
   * @param payload - The payload to process
   * @returns A step description or null if the payload cannot be processed
   */
  process(payload: unknown): StepDescription | null {
    if (!isDetoxMessage(payload)) {
      return null;
    }

    // Process different message types
    if (payload.type === 'reactNativeReload') {
      return msg('Reload React Native');
    }

    if (payload.type === 'invoke') {
      const result = payload.params
        ? (this.processInvocation(payload.params) as StepDescriptionLike | null)
        : null;

      if (isStepDescription(result)) {
        return result;
      }

      if (isStepDescriptionFriendly(result)) {
        return result.toJSON();
      }
    }

    return null;
  }

  /**
   * Processes an invocation by recursively traversing the invocation tree.
   * This is the core of the pseudo-compiler pattern.
   *
   * @param invocation - The invocation to process
   * @returns A StepDescription or null if the invocation cannot be processed
   */
  private processInvocation(invocation: InvocationValue): unknown {
    try {
      // Process the target
      const targetClass = this.processNode(invocation.target);
      if (!targetClass) {
        return null;
      }
      // Get the method name
      const methodName = invocation.method;
      // Process the arguments recursively
      const processedArgs = this.processArguments(invocation.args);
      // Get the method from the target class
      const targetClassObj = targetClass as ClassImplementation;
      // Check if the method exists and is callable
      if (typeof targetClassObj[methodName] !== 'function') {
        return null;
      }
      // Call the method with the processed arguments
      return targetClassObj[methodName](...processedArgs);
    } catch {
      return null;
    }
  }

  /**
   * Processes the arguments of an invocation.
   *
   * @param args - The arguments to process
   * @returns The processed arguments
   */
  private processArguments(args: unknown[]): unknown[] {
    return args.map((arg) => this.processNode(arg));
  }

  /**
   * Processes a node in the invocation tree.
   * This function handles different node types and delegates to appropriate processors.
   *
   * @param node - The node to process
   * @returns The processed node
   */
  private processNode(node: unknown): unknown {
    if (node == null) {
      return null;
    }

    if (Array.isArray(node)) {
      return node.map((item) => this.processNode(item));
    }

    if (typeof node !== 'object') {
      return node;
    }

    if (isClassObject(node)) {
      return this.processClassNode(node);
    }

    if (isInvocationObject(node)) {
      return this.processInvocation(node.value);
    }

    if (isPrimitiveTypeObject(node)) {
      return node.value;
    }

    return '#ERROR!';
  }

  /**
   * Processes a class node by looking up the class in the registry.
   *
   * @param node - The class node to process
   * @returns The class from the registry or null if not found
   */
  private processClassNode(node: ClassObject): ClassImplementation | null {
    const className = node.value;

    if (!(className in classRegistry)) {
      return null;
    }

    return classRegistry[className] as ClassImplementation;
  }
}
