import { currencyIdFromNetwork, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { familyOf } from "./families";
import { seededRandom } from "./random";

/** The account level of the path (`m/84h/0h/<index>h`), as every family writes it. */
export function accountIndexOf({ path }: AccountDescriptor): number {
  const index = Number.parseInt(path.split("/")[3] ?? "", 10);
  return Number.isNaN(index) ? -1 : index;
}

/** `count` mock descriptors on `network`, numbered after the highest one in `existing`; the same index always gives the same descriptor. */
export function mockDescriptors(
  network: string,
  count: number,
  existing: readonly AccountDescriptor[],
): AccountDescriptor[] {
  const currency = getCryptoCurrencyById(currencyIdFromNetwork(network));
  const family = familyOf(currency);
  const first =
    Math.max(-1, ...existing.filter(d => d.network === network).map(accountIndexOf)) + 1;
  return Array.from({ length: count }, (_, offset) =>
    family.descriptor(currency, first + offset, seededRandom(`${network}:${first + offset}`)),
  );
}
