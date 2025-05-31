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
export function step<This, Args extends unknown[], Return = unknown>(message?: string) {
  return function actualDecorator(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>,
  ) {
    async function replacementMethod(this: This, ...args: Args): Promise<Return> {
      const ctorName = (this as any).constructor.name as string;

      const name = message
        ? message.replace(/\$(\d+)/g, (_, idx) => String(args[Number(idx)]))
        : `${ctorName}.${String(context.name)}`;

      try {
        test.info();
        return await test.step(name, () => target.call(this, ...args), { box: true });
      } catch {
        return await target.call(this, ...args);
      }
    }

    return replacementMethod;
  };
}
