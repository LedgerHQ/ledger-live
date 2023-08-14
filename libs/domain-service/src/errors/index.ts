import { createCustomErrorClass } from "@ledgerhq/errors";

export const InvalidDomain = createCustomErrorClass("InvalidDomain");
export const DomainEmpty = createCustomErrorClass("DomainEmpty");
export const NoResolution = createCustomErrorClass("NoResolution");
export const UnsupportedDomainOrAddress = createCustomErrorClass("UnsupportedDomainOrAddress");
