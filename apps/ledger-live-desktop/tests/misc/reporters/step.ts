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
export function step<This, Args extends unknown[], Return>(message?: string) {
  return function actualDecorator(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>,
  ) {
    function replacementMethod(this: This, ...args: Args) {
      const name = message
        ? message.replace(/\$(\d+)/g, (_, index) => String(args[Number(index)]))
        : // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          `${(this as any).constructor.name}.${context.name as string}`;

      return test.step(name, async () => target.call(this, ...args), { box: true });
    }

    return replacementMethod;
  };
}
