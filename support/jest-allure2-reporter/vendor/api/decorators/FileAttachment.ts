import realm from '../../realms';
import type { FileAttachmentOptions } from '../../runtime';
import { typeAssertions } from '../../utils';

const allure = realm.runtime;

export function FileAttachment(options?: FileAttachmentOptions): any;
export function FileAttachment(name: string, mimeType?: string): any;
export function FileAttachment(name?: string | FileAttachmentOptions, mimeType?: string): any {
  function FileAttachmentDecorator(function_: Function, context: unknown): any;
  function FileAttachmentDecorator(
    target: object,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ): any;
  function FileAttachmentDecorator(
    maybeTarget: unknown,
    _maybeKey: unknown,
    maybeDescriptor?: unknown,
  ) {
    const descriptor: PropertyDescriptor | undefined = maybeDescriptor as PropertyDescriptor;
    const originalFunction = descriptor?.value ?? (maybeTarget as Function);
    typeAssertions.assertFunction(originalFunction, 'class method to decorate');

    const options = typeof name === 'string' ? { name, mimeType } : name;
    const wrappedFunction = allure.createFileAttachment(originalFunction, options);

    if (descriptor) {
      descriptor.value = wrappedFunction;
    } else {
      return wrappedFunction;
    }
  }

  return FileAttachmentDecorator;
}
