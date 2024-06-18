import { allure } from "allure-playwright";

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
  ): (this: This, ...args: Args) => Promise<Return> {
    async function replacementMethod(this: any, ...args: Args): Promise<Return> {
      const name = message
        ? message.replace(/\$(\d+)/g, (_, index) => args[Number(index)].toString())
        : `${this.constructor.name}.${context.name as string}`;

      return allure.step(name, async () => {
        try {
          return await target.call(this, ...args);
        } catch (error) {
          const page = (this as any).page; // Ensure 'page' is accessible in the context
          if (page) {
            const screenshot = await page.screenshot();
            await allure.attachment(`Screenshot on Failure: ${name}`, screenshot, "image/png");
          }
          throw error; // Re-throw the error to ensure the test fails
        }
      }) as Promise<Return>; // Explicitly cast to Promise<Return> to match return type
    }

    return replacementMethod;
  };
}
