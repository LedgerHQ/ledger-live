/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useAPI } from "./useAPI";

function deferred<T>() {
  let resolve: ((value: T) => void) | undefined;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve: (value: T) => resolve?.(value) };
}

describe("useAPI", () => {
  it("shares one request between hooks asking for the same data at the same time", async () => {
    const catalog = deferred<string[]>();
    const queryFn = jest.fn((_props: { key: string }) => catalog.promise);
    const useCatalog = () => useAPI({ queryFn, queryProps: { key: "shared-request" } });

    const first = renderHook(useCatalog);
    const second = renderHook(useCatalog);
    catalog.resolve(["bitcoin"]);

    await waitFor(() => expect(first.result.current.data).toEqual(["bitcoin"]));
    await waitFor(() => expect(second.result.current.data).toEqual(["bitcoin"]));
    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});
