import { createCustomErrorClass } from "@ledgerhq/errors/lib/helpers"; // TODO: check tsconfig..

export const StacksMemoTooLong = createCustomErrorClass("StacksMemoTooLong");
