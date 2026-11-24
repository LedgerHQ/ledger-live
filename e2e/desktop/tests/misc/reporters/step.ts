import test from "@playwright/test";

type HasConstructor = {
  constructor: {
    name: string;
  };
};

/**
 * Decorator that wraps a function with a Playwright test step.
 * Used for reporting purposes.
 *
 * @example
 ```
 import { step } from 'tests/misc/reporters/step';
 class MyTestClass {
 @step('optional step name')
 async myTestFunction() {
 // Test code goes here
 }
 }
 ```
 */
export function step<This extends HasConstructor, Args extends unknown[], Return = unknown>(
  message?: string,
) {
  return function actualDecorator(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>,
  ) {
    async function replacementMethod(this: This, ...args: Args): Promise<Return> {
      const ctorName = this.constructor.name;

      const name = message
        ? message.replace(/\$(\d+|[A-Za-z_]\w*)/g, (placeholder, key: string) => {
            if (/^\d+$/.test(key)) return String(args[Number(key)]);
            const value: unknown = Object.hasOwn(this, key) ? Reflect.get(this, key) : undefined;
            if (
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean"
            ) {
              return String(value);
            }
            console.warn(
              `@step "${message}": "${key}" is not a string, number or boolean field on ${ctorName}`,
            );
            return placeholder;
          })
        : `${ctorName}.${String(context.name)}`;

      try {
        return await test.step(name, () => target.call(this, ...args), { box: true });
      } catch (error) {
        if (error instanceof Error && error.message.includes("can only be called from a test")) {
          return await target.call(this, ...args);
        }
        throw error;
      }
    }

    return replacementMethod;
  };
}
