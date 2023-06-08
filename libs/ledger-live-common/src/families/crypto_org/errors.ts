import { createCustomErrorClass } from "@ledgerhq/errors";
export const CryptoOrgWrongSignatureHeader = createCustomErrorClass(
  "CryptoOrgWrongSignatureHeader",
);
export const CryptoOrgSignatureSize = createCustomErrorClass("CryptoOrgSignatureSize");
export const CryptoOrgErrorBroadcasting = createCustomErrorClass("CryptoOrgErrorBroadcasting");
