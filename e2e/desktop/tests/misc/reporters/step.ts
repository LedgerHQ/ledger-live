import test from "@playwright/test";

/**
 * Decorator that wraps a function with a Playwright test step.
 * Used for reporting purposes.
 *
 * @example
 ```
 import { step } from './step_decorator';
 class MyTestClass {
 @step('optional step name')
 async myTestFunction() {
 // Test code goes here
 }
 }
 ```
 */
export function step<This, Args extends any[], Return>(message?: string) {
  return function actualDecorator(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>,
  ) {
    function replacementMethod(this: any, ...args: Args) {
      const name = message
        ? message.replace(/\$(\d+)/g, (_, index) => args[Number(index)].toString())
        : `${this.constructor.name}.${context.name as string}`;

      return test.step(name, async () => target.call(this, ...args), { box: true });
    }

    return replacementMethod;
  };
}
