require("@testing-library/jest-dom");

/*
 * The features CI job does not install libs/env, so @shared/env cannot resolve @ledgerhq/live-env
 * and any test importing the domain barrel fails to load. See test-features-reusable.yml.
 */
jest.mock("@shared/env", () => ({
  getEnv: jest.fn(name => {
    if (name === "DADA_GRAVITEE_API_KEY") return "";
    return name === "DADA_API_STAGING"
      ? "https://gravitee-internal-gateway.ldg-stg-apim.aws.stg.ldg-tech.com/dada"
      : "https://dada.api.ledger.com/v1";
  }),
}));
