describe("mapNotNil", () => {
  const double = (x: number) => x * 2;
  const toString = (x: number) => x.toString();

  it("should return empty array for null input", () => {
    expect(mapNotNil(null, double)).toEqual([]);
  });

  it("should return empty array for undefined input", () => {
    expect(mapNotNil(undefined, double)).toEqual([]);
  });

  it("should return empty array for empty input array", () => {
    expect(mapNotNil([], double)).toEqual([]);
  });

  it("should map and filter out null and undefined values", () => {
    const input = [1, null, 2, undefined, 3];
    expect(mapNotNil(input, double)).toEqual([2, 4, 6]);
  });

  it("should handle different mapping function return types", () => {
    const input = [1, null, 2, undefined, 3];
    expect(mapNotNil(input, toString)).toEqual(["1", "2", "3"]);
  });
});
