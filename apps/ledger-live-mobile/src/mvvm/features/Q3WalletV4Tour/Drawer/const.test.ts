import { getQ3WalletV4Tour, resolveQ3WalletV4TourVariant } from "./const";

describe("getQ3WalletV4Tour", () => {
  it("returns the q3_a Pay-with-card tour by default", () => {
    expect(getQ3WalletV4Tour("q3_a").slides.map(slide => slide.titleKey)).toEqual([
      "q3WalletV4Tour.intro.title",
      "q3WalletV4Tour.contact.title",
      "q3WalletV4Tour.pay.title",
      "q3WalletV4Tour.yield.title",
    ]);
    expect(getQ3WalletV4Tour("q3_a").slides.map(slide => slide.subTitleKey)).toEqual([
      "q3WalletV4Tour.intro.subTitle",
      "q3WalletV4Tour.contact.subTitle",
      "q3WalletV4Tour.pay.subTitle",
      "q3WalletV4Tour.yield.subTitle",
    ]);
    expect(getQ3WalletV4Tour(undefined).slides).toHaveLength(4);
    expect(getQ3WalletV4Tour("q3_a").variant).toBe("q3_a");
    expect(getQ3WalletV4Tour(undefined).variant).toBe("q3_a");
    expect(getQ3WalletV4Tour("q2").variant).toBe("q3_a");
  });

  it("returns the q3_b tour without Pay", () => {
    expect(getQ3WalletV4Tour("q3_b").slides.map(slide => slide.titleKey)).toEqual([
      "q3WalletV4Tour.intro.title",
      "q3WalletV4Tour.contactNoPay.title",
      "q3WalletV4Tour.yield.title",
    ]);
    expect(getQ3WalletV4Tour("q3_b").variant).toBe("q3_b");
  });

  it("returns the q3_b2 tour with Pay without card", () => {
    expect(getQ3WalletV4Tour("q3_b2").slides.map(slide => slide.titleKey)).toEqual([
      "q3WalletV4Tour.intro.title",
      "q3WalletV4Tour.contact.title",
      "q3WalletV4Tour.payNoCard.title",
      "q3WalletV4Tour.yield.title",
    ]);
    expect(getQ3WalletV4Tour("q3_b2").slides[2]?.subTitleKey).toBe(
      "q3WalletV4Tour.payNoCard.subTitle",
    );
    expect(getQ3WalletV4Tour("q3_b2").variant).toBe("q3_b2");
  });
});

describe("resolveQ3WalletV4TourVariant", () => {
  it("should keep Q3 variants and fall back to q3_a", () => {
    expect(resolveQ3WalletV4TourVariant("q3_a")).toBe("q3_a");
    expect(resolveQ3WalletV4TourVariant("q3_b")).toBe("q3_b");
    expect(resolveQ3WalletV4TourVariant("q3_b2")).toBe("q3_b2");
    expect(resolveQ3WalletV4TourVariant("q2")).toBe("q3_a");
    expect(resolveQ3WalletV4TourVariant(undefined)).toBe("q3_a");
  });
});
