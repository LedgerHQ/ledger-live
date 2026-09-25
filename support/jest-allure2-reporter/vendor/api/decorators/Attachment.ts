import realm from '../../realms';
import type { ContentAttachmentOptions } from '../../runtime';
import { typeAssertions } from '../../utils';

const allure = realm.runtime;

export function Attachment(options: ContentAttachmentOptions): any;
export function Attachment(name: string, mimeType?: string): any;
export function Attachment(name: string | ContentAttachmentOptions, mimeType?: string): any {
  typeAssertions.assertNotNullish(name, 'name string or options');

  function AttachmentDecorator(function_: Function, context: unknown): any;
  function AttachmentDecorator(
    target: object,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ): any;
  function AttachmentDecorator(
    maybeTarget: unknown,
    _maybeKey: unknown,
    maybeDescriptor?: unknown,
  ) {
    const descriptor: PropertyDescriptor | undefined = maybeDescriptor as PropertyDescriptor;
    const originalFunction = descriptor?.value ?? (maybeTarget as Function);
    typeAssertions.assertFunction(originalFunction, 'class method to decorate');

    const options = typeof name === 'string' ? { name, mimeType } : name;
    const wrappedFunction = allure.createAttachment(originalFunction, options);

    if (descriptor) {
      descriptor.value = wrappedFunction;
    } else {
      return wrappedFunction;
    }
  }

  return AttachmentDecorator;
}
