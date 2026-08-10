require("@testing-library/jest-dom");

/*
 * The features CI job does not install libs/env, so @shared/env cannot resolve @ledgerhq/live-env
 * and any test importing the domain barrel fails to load. See test-features-reusable.yml.
 */
jest.mock("@shared/env", () => ({
  getEnv: jest.fn(name =>
    name === "DADA_API_STAGING"
      ? "https://dada.api.ledger-test.com/v1"
      : "https://dada.api.ledger.com/v1",
  ),
}));
