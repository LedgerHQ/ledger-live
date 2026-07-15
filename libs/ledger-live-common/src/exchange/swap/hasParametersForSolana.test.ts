import { hasParametersForSolana } from "./hasParametersForSolana";

describe("hasParametersForSolana", () => {
  it("should return true when parameters contains Solana parameters", () => {
    expect(
      hasParametersForSolana({
        data: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDNzWs4isgmR+LEHY8ZcgBBLMnC4ckD1iuhSa2/Y+69I91oyGFaAZ/9w4srgx9KoqiHtPM6Vur7h4D6XVoSgrEhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALt5JNk+MAN8BXYrlkxMEL1C/sM3+ZFYwZw4eofBOKp4BAgIAAQwCAAAAgJaYAAAAAAA=",
        templateId: "084c694669",
      }),
    ).toEqual(true);
  });

  it.each([null, undefined, {}, { gasLimit: 1 }])(
    "should return false when parameters (%s) do not contains Solana parameters",
    (parameters: unknown) => {
      expect(hasParametersForSolana(parameters)).toEqual(false);
    },
  );
});
