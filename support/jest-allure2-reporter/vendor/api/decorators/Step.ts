import type { UserParameter } from '../../runtime';
import realm from '../../realms';
import { typeAssertions } from '../../utils';

const allure = realm.runtime;

export function Step(name: string, arguments_?: UserParameter[]): any {
  if (arguments_ !== undefined) {
    typeAssertions.assertArray(arguments_, 'arguments');
  }

  function StepDecorator(function_: Function, context: unknown): any;
  function StepDecorator(target: object, key: string | symbol, descriptor: PropertyDescriptor): any;
  function StepDecorator(maybeTarget: unknown, _maybeKey: unknown, maybeDescriptor?: unknown) {
    const descriptor: PropertyDescriptor | undefined = maybeDescriptor as PropertyDescriptor;
    const originalFunction = descriptor?.value ?? (maybeTarget as Function);
    typeAssertions.assertFunction(originalFunction, 'class method to decorate');

    const wrappedFunction =
      arguments_ === undefined
        ? allure.createStep(name, originalFunction)
        : allure.createStep(name, arguments_, originalFunction);

    if (descriptor) {
      descriptor.value = wrappedFunction;
    } else {
      return wrappedFunction;
    }
  }

  return StepDecorator;
}
