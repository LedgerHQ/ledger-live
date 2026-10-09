---
"ledger-live-mobile-e2e-tests": patch
---

Show the mobile e2e test descriptions (test file, shard, Speculos apps, token approval results, live app) in Allure 3 reports (QAA-1535). They are now set with `allure.descriptionHtml()`: `jest-allure2-reporter` writes an empty `descriptionHtml` next to a plain `description`, and Allure 3 renders that empty string instead of the description.
