import { z } from "zod";
import type { NoSensitive } from "./sensitive";

const Secret = z.string().brand<"Key">().brand<"Sensitive">();
type Secret = z.infer<typeof Secret>;
const Public = z.string().brand<"NetworkId">();
type Public = z.infer<typeof Public>;

const accept = <P extends object>(props: P & NoSensitive<P>): P => props;

describe("NoSensitive", () => {
  const secret = Secret.parse("xpub");
  const open = Public.parse("bitcoin");

  it("accepts props without a sensitive value", () => {
    expect(accept({ network: open, count: 1, nested: { list: [open] } })).toBeDefined();
  });

  it("accepts any and unknown values", () => {
    const anything: unknown = secret;
    expect(accept({ anything, record: {} as Record<string, unknown> })).toBeDefined();
  });

  it("refuses a sensitive value, at any depth", () => {
    // @ts-expect-error a Sensitive brand at the top level
    accept({ key: secret });
    // @ts-expect-error a Sensitive brand in a nested object
    accept({ account: { network: open, key: secret } });
    // @ts-expect-error a Sensitive brand in an array
    accept({ keys: [secret] });
    // @ts-expect-error an optional Sensitive field
    accept<{ key?: Secret }>({});
    expect(true).toBe(true);
  });
});
