type AssertExhaustiveConstraint = string | number | bigint | boolean | null | undefined;

/**
 * Asserts that the type B is a subset of A and vice versa.
 *
 * How to use:
 * ```
 * const _assertSomething: AssertExhaustive<
 *   'foo' | 'bar',
 *   'foo' | 'bar' | 'baz'
 * > = true;
 *
 * This will throw an error if the type 'baz' is missing from the union.
 */
export type AssertExhaustive<
  A extends AssertExhaustiveConstraint,
  B extends AssertExhaustiveConstraint,
> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : `Type A is missing: ${Exclude<B, A>}`
  : `Type B is missing: ${Exclude<A, B>}`;

const _x: AssertExhaustive<"foo" | "bar" | "baz", "foo" | "bar" | "baz"> = true;
