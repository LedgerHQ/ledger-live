import { connectLogsToSentry, startSpan } from "./performance";

test("connectLogsToSentry", () => {
  const finish = jest.fn();
  const startChild = jest.fn((arg) => ({ arg, finish }));
  const getSpan = jest.fn(() => ({ startChild }));
  const Sentry = {
    getCurrentHub: () => ({
      getScope: () => ({ getSpan }),
    }),
  };
  connectLogsToSentry(Sentry);
  const span = startSpan("op", "desc", { tags: { foo: 42 } });
  expect(startChild.mock.calls.length).toBe(1);
  expect(startChild.mock.calls[0][0]).toMatchObject({
    op: "op",
    description: "desc",
    tags: { foo: 42 },
  });
  expect(finish.mock.calls.length).toBe(0);
  span.finish();
  startSpan("ignored");
  expect(finish.mock.calls.length).toBe(1);
  span.finish();
  expect(finish.mock.calls.length).toBe(1);
});
