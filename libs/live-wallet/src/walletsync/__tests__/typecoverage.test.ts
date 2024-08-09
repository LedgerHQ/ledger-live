/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-labels */
import walletsync from "..";
import type { DistantState, Schema } from "..";

// NB: these tests are here to ensure that the types are still correctly inferred and that we don't accidentally infer types as any
test("type coverage", () => {
  const schema = walletsync.schema;

  // @ts-expect-error schema is not a string! this way we verify that the type is correct
  const _1: string = schema;

  // verify that the schema indeed matches the type exported
  const _2: Schema = schema;

  expect(() =>
    // @ts-expect-error these are incoherent types not matching the types. this way we guarantee we didn't infer them as any
    walletsync.diffLocalToDistant({}, {}),
  ).toThrow();

  expect(schema).toBeDefined();
});
