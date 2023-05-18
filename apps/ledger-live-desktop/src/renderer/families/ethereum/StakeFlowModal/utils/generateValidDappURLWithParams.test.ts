import { generateValidDappURLWithParams } from "./generateValidDappURLWithParams";

describe("generateValidDappURLWithParams.test", () => {
  const manifest1 = {
    params: {
      dappUrl: "https://example.com?existingParam=123",
    },
  };

  const manifest2 = {
    params: {
      dappUrl: "invalid-url",
    },
  };

  const manifest3 = {
    params: {
      dappUrl: "https://example.com",
    },
  };

  const queryString1 = {
    param1: "value1",
    param2: ["value2", "value3"],
  };

  const queryString2 = {
    foo: "bar",
    baz: ["qux", "quux"],
  };

  test("should append query strings to an existing URL and not remove existing query parameters when they exist", () => {
    const result = generateValidDappURLWithParams(manifest1, queryString1);
    const expected =
      "https://example.com/?existingParam=123&param1=value1&param2=value2&param2=value3";

    expect(result).toBeDefined();
    expect(result!.toString()).toBe(expected);
  });

  test("should handle array values in query strings", () => {
    const result = generateValidDappURLWithParams(manifest1, queryString2);
    const expected = "https://example.com/?existingParam=123&foo=bar&baz=qux&baz=quux";

    expect(result).toBeDefined();
    expect(result!.toString()).toBe(expected);
  });

  test("should append a query string to the new url", () => {
    const result = generateValidDappURLWithParams(manifest3, queryString1);
    const expected = "https://example.com/?param1=value1&param2=value2&param2=value3";

    expect(result).toBeDefined();
    expect(result!.toString()).toBe(expected);
  });

  test("should not append any additional queries if the query string parameter is undefined", () => {
    const result = generateValidDappURLWithParams(manifest1);
    const expected = "https://example.com/?existingParam=123";

    expect(result).toBeDefined();
    expect(result!.toString()).toBe(expected);
  });

  test("should return undefined for an invalid URL", () => {
    const result = generateValidDappURLWithParams(manifest2, queryString1);
    expect(result).toBeUndefined();
  });

  test("should return undefined for undefined manifest", () => {
    const result = generateValidDappURLWithParams(undefined, queryString1);

    expect(result).toBeUndefined();
  });
});
