---
applyTo: "e2e/**,libs/live-e2e-shared/**"
---

# E2E changes

The E2E conventions are project guidelines: [shared](../../e2e/docs/e2e-conventions.md), [mobile](../../e2e/mobile/docs/e2e-mobile-conventions.md), [mobile elements](../../e2e/mobile/docs/e2e-mobile-elements.md), [desktop](../../e2e/desktop/docs/e2e-desktop-conventions.md). Apply the shared rules and those of the client the diff touches.

Before judging a change, read:

- the product code that decides each path the test takes;
- the page objects of the same client, to find locators declared twice;
- the `live-e2e-shared` enums the test builds ids from;
- the product source behind any product claim in the PR description.

Rules to check first (each links to its full text and exceptions):

- [Setup MUST be deterministic](../../e2e/docs/e2e-conventions.md#setup-must-be-deterministic)
- [A product branch MUST follow the product's own rule](../../e2e/docs/e2e-conventions.md#a-product-branch-must-follow-the-products-own-rule)
- [Test-data ids MUST match the product ids they select](../../e2e/docs/e2e-conventions.md#test-data-ids-must-match-the-product-ids-they-select)
- [Selectors MUST live on the page object that renders the screen](../../e2e/docs/e2e-conventions.md#selectors-must-live-on-the-page-object-that-renders-the-screen)
- [Selectors MUST be non-public and readonly](../../e2e/docs/e2e-conventions.md#selectors-must-be-non-public-and-readonly)
- [A helper call MUST match what the helper does](../../e2e/docs/e2e-conventions.md#a-helper-call-must-match-what-the-helper-does)
- [A step label MUST name what the step acts on](../../e2e/docs/e2e-conventions.md#a-step-label-must-name-what-the-step-acts-on)
- [An assertion MUST fail when the feature does not produce the value](../../e2e/docs/e2e-conventions.md#an-assertion-must-fail-when-the-feature-does-not-produce-the-value)
- [Tests MUST NOT hide an interaction failure](../../e2e/docs/e2e-conventions.md#tests-must-not-hide-an-interaction-failure)
- [Every test MUST include a TMS annotation](../../e2e/docs/e2e-conventions.md#every-test-must-include-a-tms-annotation)
- Mobile: [Tests MUST NOT use conditional steps](../../e2e/mobile/docs/e2e-mobile-conventions.md#tests-must-not-use-conditional-steps)
- Mobile: [A reached screen MUST stay its own class](../../e2e/mobile/docs/e2e-mobile-conventions.md#a-reached-screen-must-stay-its-own-class)
- Mobile: [A sheet wait MUST use that sheet's content anchor at 100% visibility](../../e2e/mobile/docs/e2e-mobile-conventions.md#a-sheet-wait-must-use-that-sheets-content-anchor-at-100-visibility)
- Mobile: [Navigation MUST go through the UI](../../e2e/mobile/docs/e2e-mobile-conventions.md#navigation-must-go-through-the-ui)
- Mobile: [Assertions](../../e2e/mobile/docs/e2e-mobile-elements.md#assertions): a wait is not an assertion
- Desktop: [Locators MUST use getByTestId() when a test id exists](../../e2e/desktop/docs/e2e-desktop-conventions.md#locators-must-use-getbytestid-when-a-test-id-exists)
- Desktop: [Journey gates MUST use hard assertions](../../e2e/desktop/docs/e2e-desktop-conventions.md#journey-gates-must-use-hard-assertions)
- Desktop: [Every public page-object method MUST use the @step decorator](../../e2e/desktop/docs/e2e-desktop-conventions.md#every-public-page-object-method-must-use-the-step-decorator)
