import {
  parseOrder,
  sanitizeExtras,
  buildContentCardTrackingProperties,
  isCategoryContentCardExtras,
  finalizeContentCardEventProperties,
} from "./contentCardExtras";

describe("parseOrder", () => {
  it("should parse a valid numeric string", () => {
    expect(parseOrder("3")).toBe(3);
  });

  it("should parse zero", () => {
    expect(parseOrder("0")).toBe(0);
  });

  it("should parse a negative number", () => {
    expect(parseOrder("-1")).toBe(-1);
  });

  it("should return undefined for undefined input", () => {
    expect(parseOrder(undefined)).toBeUndefined();
  });

  it("should return undefined for an empty string", () => {
    expect(parseOrder("")).toBeUndefined();
  });

  it("should return undefined for a non-numeric string", () => {
    expect(parseOrder("abc")).toBeUndefined();
  });

  it("should return undefined for 'NaN'", () => {
    expect(parseOrder("NaN")).toBeUndefined();
  });

  it("should return undefined for 'undefined'", () => {
    expect(parseOrder("undefined")).toBeUndefined();
  });

  it("should truncate a float string to an integer", () => {
    expect(parseOrder("2.7")).toBe(2);
  });

  it("should parse a string with leading whitespace", () => {
    expect(parseOrder(" 5")).toBe(5);
  });
});

describe("sanitizeExtras", () => {
  it("should return an empty object for undefined extras", () => {
    expect(sanitizeExtras(undefined)).toEqual({});
  });

  it("should convert a valid order string to a number", () => {
    const result = sanitizeExtras({ order: "2", title: "Hello" });
    expect(result).toEqual({ order: 2, title: "Hello" });
  });

  it("should omit order when the value is not numeric", () => {
    const result = sanitizeExtras({ order: "abc", title: "Hello" });
    expect(result).toEqual({ title: "Hello" });
    expect(result).not.toHaveProperty("order");
  });

  it("should omit order when it is missing from extras", () => {
    const result = sanitizeExtras({ title: "Hello" });
    expect(result).toEqual({ title: "Hello" });
    expect(result).not.toHaveProperty("order");
  });

  it("should preserve all other extras as strings", () => {
    const result = sanitizeExtras({
      order: "1",
      title: "Title",
      location: "top_wallet",
      type: "hero",
    });
    expect(result).toEqual({
      order: 1,
      title: "Title",
      location: "top_wallet",
      type: "hero",
    });
  });

  it("should handle order of zero", () => {
    const result = sanitizeExtras({ order: "0" });
    expect(result).toEqual({ order: 0 });
  });

  it("should omit displayedPosition from Braze extras", () => {
    const result = sanitizeExtras({
      title: "Promo",
      displayedPosition: "campaign_slot",
      order: "1",
    });
    expect(result).toEqual({ title: "Promo", order: 1 });
    expect(result).not.toHaveProperty("displayedPosition");
  });
});

describe("buildContentCardTrackingProperties", () => {
  it("should inherit canvas_name from category and keep child canvas_step_name", () => {
    expect(
      buildContentCardTrackingProperties({
        cardExtras: {
          title: "Buy",
          canvas_step_name: "Buy step",
          categoryId: "alwayson",
        },
        categoryExtras: {
          id: "alwayson",
          type: "category",
          canvas_name: "Wallet canvas",
          canvas_step_name: "Category step",
        },
        categoryLocation: "top_wallet",
      }),
    ).toEqual({
      title: "Buy",
      categoryId: "alwayson",
      page: "top_wallet",
      location: "top_wallet",
      canvas_name: "Wallet canvas",
      canvas_step_name: "Buy step",
    });
  });

  it("should not use category canvas_step_name when child has none", () => {
    expect(
      buildContentCardTrackingProperties({
        cardExtras: { title: "Buy", categoryId: "alwayson" },
        categoryExtras: {
          id: "alwayson",
          type: "category",
          canvas_name: "Wallet canvas",
          canvas_step_name: "Category step",
        },
        categoryLocation: "top_wallet",
      }),
    ).toEqual({
      title: "Buy",
      categoryId: "alwayson",
      page: "top_wallet",
      location: "top_wallet",
      canvas_name: "Wallet canvas",
    });
  });

  it("should resolve alwayson category to top_wallet when categoryLocation is omitted", () => {
    expect(
      buildContentCardTrackingProperties({
        cardExtras: { title: "Buy", categoryId: "alwayson" },
        categoryExtras: {
          id: "alwayson",
          type: "category",
          canvas_name: "Wallet canvas",
        },
      }),
    ).toEqual({
      title: "Buy",
      categoryId: "alwayson",
      page: "top_wallet",
      location: "top_wallet",
      canvas_name: "Wallet canvas",
    });
  });

  it("should fall back to categoryExtras.location when categoryLocation is omitted", () => {
    expect(
      buildContentCardTrackingProperties({
        cardExtras: { title: "Promo", categoryId: "earn" },
        categoryExtras: {
          id: "earn",
          type: "category",
          location: "portfolio",
          canvas_name: "Earn canvas",
        },
      }),
    ).toEqual({
      title: "Promo",
      categoryId: "earn",
      page: "portfolio",
      location: "portfolio",
      canvas_name: "Earn canvas",
    });
  });
});

describe("finalizeContentCardEventProperties", () => {
  it("should keep a numeric displayedPosition and strip leaked string values from extras", () => {
    expect(
      finalizeContentCardEventProperties({
        ...buildContentCardTrackingProperties({
          cardExtras: { title: "Buy", displayedPosition: "invalid" },
        }),
        displayedPosition: 2,
      }),
    ).toEqual({
      title: "Buy",
      displayedPosition: 2,
    });
  });

  it("should omit displayedPosition when it is not a number", () => {
    expect(
      finalizeContentCardEventProperties({
        title: "Buy",
        displayedPosition: "invalid",
      }),
    ).toEqual({ title: "Buy" });
  });

  it("should omit displayedPosition when it is undefined", () => {
    expect(finalizeContentCardEventProperties({ title: "Buy" })).toEqual({ title: "Buy" });
  });

  it("should omit displayedPosition when it is NaN", () => {
    expect(
      finalizeContentCardEventProperties({
        title: "Buy",
        displayedPosition: Number.NaN,
      }),
    ).toEqual({ title: "Buy" });
  });
});

describe("isCategoryContentCardExtras", () => {
  it("should detect category cards", () => {
    expect(isCategoryContentCardExtras({ type: "category" })).toBe(true);
    expect(isCategoryContentCardExtras({ type: "action" })).toBe(false);
  });
});
