import { z } from "zod";
import { getCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import { AccountPathSchema, AddressPathSchema, type AccountPath, type AddressPath } from "./paths";

type Placeholder = "coin_type" | "account" | "node" | "address";
type SchemeSegment = `${number}` | `${number}'` | `<${Placeholder}>` | `<${Placeholder}>'`;

/** `S` when each `/`-separated segment is an index or a placeholder, hardened or not; `never` otherwise. */
type ValidScheme<S extends string> = S extends `${infer Head}/${infer Tail}`
  ? Head extends SchemeSegment
    ? [ValidScheme<Tail>] extends [never]
      ? never
      : S
    : never
  : S extends SchemeSegment
    ? S
    : never;

const SEGMENT = String.raw`(?:\d+|<(?:coin_type|account|node|address)>)'?`;

/** A path template, e.g. `44'/<coin_type>'/<account>'/<node>/<address>`, as `derivation.ts` spells it. */
const DerivationSchemeSchema = z
  .string()
  .regex(new RegExp(`^${SEGMENT}(?:/${SEGMENT})*$`), "Not a derivation scheme")
  .brand<"DerivationScheme">();

export type DerivationScheme = z.infer<typeof DerivationSchemeSchema>;

/** A scheme checked when written: a typo in a segment fails the typecheck. */
export const derivationScheme = <const S extends string>(scheme: S & ValidScheme<S>) =>
  DerivationSchemeSchema.parse(scheme);

/** The BIP44 scheme of a purpose, on the coin type of `forkedFrom` for an unsplit mode. */
export function standardScheme(
  purpose: number,
  forkedFrom: CryptoCurrency["forkedFrom"],
): DerivationScheme {
  const coinType = forkedFrom ? getCryptoCurrencyById(forkedFrom).coinType : "<coin_type>";
  return DerivationSchemeSchema.parse(`${purpose}'/${coinType}'/<account>'/<node>/<address>`);
}

/** The scheme filled for an account's first address, as `runDerivationScheme`. */
export function addressPathOf(
  scheme: DerivationScheme,
  coinType: number,
  index: number,
): AddressPath {
  return AddressPathSchema.parse(
    `m/${scheme
      .replace("<coin_type>", String(coinType))
      .replace("<account>", String(index))
      .replace("<node>", "0")
      .replace("<address>", "0")}`,
  );
}

/** The account part of the scheme filled, as `runAccountDerivationScheme` without its placeholder segments. */
export function accountPathOf(
  scheme: DerivationScheme,
  coinType: number,
  index: number,
): AccountPath {
  const segments = scheme
    .replace("<coin_type>", String(coinType))
    .replace("<account>", String(index))
    .split("/");
  // The segments after the account level, a node or an address, hardened or not (Polkadot's `<address>'`).
  while (segments.length > 0 && /<(node|address)>/.test(segments.at(-1) ?? "")) {
    segments.pop();
  }
  return AccountPathSchema.parse(`m/${segments.join("/")}`);
}
