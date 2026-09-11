import { getQ3TourConfig } from "./const";

describe("getQ3TourConfig", () => {
  it("should return Contacts and Pay with card for q3_a", () => {
    expect(getQ3TourConfig("q3_a").slides.map(slide => slide.id)).toEqual([
      "intro",
      "contact",
      "pay",
      "yield",
    ]);
  });

  it("should return Contacts B without Pay for q3_b", () => {
    expect(getQ3TourConfig("q3_b").slides.map(slide => slide.id)).toEqual([
      "intro",
      "contact-no-pay",
      "yield",
    ]);
  });

  it("should return Pay without card for q3_b2", () => {
    expect(getQ3TourConfig("q3_b2").slides.map(slide => slide.id)).toEqual([
      "intro",
      "contact",
      "pay-no-card",
      "yield",
    ]);
  });

  it("should return q3_a config when the variant is missing or non-Q3", () => {
    expect(getQ3TourConfig(undefined).slides.map(slide => slide.id)).toEqual([
      "intro",
      "contact",
      "pay",
      "yield",
    ]);
    expect(getQ3TourConfig("q2").slides.map(slide => slide.id)).toEqual([
      "intro",
      "contact",
      "pay",
      "yield",
    ]);
  });
});
