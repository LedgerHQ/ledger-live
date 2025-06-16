import { createCustomErrorClass } from "@ledgerhq/errors";

/*
 * When sender and receiver chain ids are differents.
 */
export const KadenaCrossChainTransfer = createCustomErrorClass("KadenaCrossChainTransfer");
