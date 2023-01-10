import { createCustomErrorClass } from "@ledgerhq/errors";

export const NervosAmountTooLow = createCustomErrorClass("NervosAmountTooLow");
export const NervosSendingMoreAmount = createCustomErrorClass("NervosSendingMoreAmount");
