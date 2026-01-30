import { useErrorLinks } from "./useErrorLinks";
import { renderHook } from "tests/testSetup";

const renderUseErrorLinks = (error?: Error | null) => {
  return renderHook(() => useErrorLinks(error));
};

describe("useErrorLinks", () => {
  it("returns empty object when no error is provided", () => {
    const { result } = renderUseErrorLinks();
    expect(result.current).toEqual({});
  });

  it("returns empty object when error has no links", () => {
    const error = new Error("Test error");
    const { result } = renderUseErrorLinks(error);
    expect(result.current).toEqual({});
  });

  it("creates links for absolute URLs", () => {
    const error = {
      links: ["https://example.com", "http://test.com"],
    } as unknown as Error;
    const { result } = renderUseErrorLinks(error);

    expect(Object.keys(result.current)).toHaveLength(2);
  });

  it("creates buttons for relative URLs", () => {
    const error = {
      links: ["/relative/path?param=value"],
    } as unknown as Error;
    const { result } = renderUseErrorLinks(error);
    const currentResult = result.current;
    expect(currentResult).toBeInstanceOf(Object);
    expect(Object.keys(currentResult)).toHaveLength(1);

    expect(currentResult["link0"].props).toHaveProperty("data-testid", "translated-error-link-0");
  });

  it("filters out invalid links", () => {
    const error = {
      links: ["https://example.com", 123, null, undefined, "/relative/path"],
    } as unknown as Error;
    const { result } = renderUseErrorLinks(error);
    const currentResult = result.current;

    expect(Object.keys(currentResult)).toHaveLength(2);

    expect(currentResult["link0"].props).toHaveProperty("data-testid", "translated-error-link-0");
    expect(currentResult["link1"].props).toHaveProperty("data-testid", "translated-error-link-1");
  });

  it("handles the condition getSafeStringLinks correctly", () => {
    const validError = { links: ["https://example.com"] } as unknown as Error;
    const invalidError1 = { links: "not-an-array" } as unknown as Error;
    const invalidError2 = { noLinks: [] } as unknown as Error;

    //https://ledgerhq.atlassian.net/browse/LIVE-14178
    const errorInOperator = "Invalid extension provided" as unknown as Error;

    const { result: resultValid } = renderUseErrorLinks(validError);
    expect(Object.keys(resultValid.current)).toHaveLength(1);

    const { result: resultInvalid1 } = renderUseErrorLinks(invalidError1);
    expect(resultInvalid1.current).toEqual({});

    const { result: resultInvalid2 } = renderUseErrorLinks(invalidError2);
    expect(resultInvalid2.current).toEqual({});

    const { result: resultErrorInOperator } = renderUseErrorLinks(errorInOperator);
    expect(resultErrorInOperator.current).toEqual({});
  });
});
