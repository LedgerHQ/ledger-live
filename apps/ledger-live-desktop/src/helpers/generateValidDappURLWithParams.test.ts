import { generateValidDappURLWithParams } from "./generateValidDappURLWithParams";

describe("generateValidDappURLWithParams.test", () => {
  const manifestWithValidURLWithQueryString = {
    params: {
      dappUrl: "https://example.com?existingParam=123",
    },
  };

  const manifestWithInvalidURL = {
    params: {
      dappUrl: "invalid-url",
    },
  };

  const manifestWithValidURL = {
    params: {
      dappUrl: "https://example.com",
    },
  };

  const queryStringToAdd = {
    param1: "value1",
    param2: ["value2", "value3"],
  };

  test("should append query strings to an existing URL and not remove existing query parameters when they exist", () => {
    const result = generateValidDappURLWithParams(
      manifestWithValidURLWithQueryString,
      queryStringToAdd,
    );
    const expected =
      "https://example.com/?existingParam=123&param1=value1&param2=value2&param2=value3";

    expect(result).toBeDefined();
    expect(result!.toString()).toBe(expected);
  });

  test("should append a query string to the new url", () => {
    const result = generateValidDappURLWithParams(manifestWithValidURL, queryStringToAdd);
    const expected = "https://example.com/?param1=value1&param2=value2&param2=value3";

    expect(result).toBeDefined();
    expect(result!.toString()).toBe(expected);
  });

  test("should not append any additional queries if the query string parameter is undefined", () => {
    const result = generateValidDappURLWithParams(manifestWithValidURLWithQueryString);
    const expected = "https://example.com/?existingParam=123";

    expect(result).toBeDefined();
    expect(result!.toString()).toBe(expected);
  });

  test("should return undefined for an invalid URL", () => {
    const result = generateValidDappURLWithParams(manifestWithInvalidURL, queryStringToAdd);
    expect(result).toBeUndefined();
  });

  test("should return undefined for undefined manifest", () => {
    const result = generateValidDappURLWithParams(undefined, queryStringToAdd);

    expect(result).toBeUndefined();
  });
});
