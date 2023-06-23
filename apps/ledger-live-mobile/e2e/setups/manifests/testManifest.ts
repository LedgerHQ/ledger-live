import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

export function getTestManifest(): LiveAppManifest {
  return {
    id: "multibuy",
    name: "Test App",
    url: "http://localhost:3000",
    homepageUrl: "https://dev.ledger.com",
    platforms: ["ios", "android", "desktop"],
    apiVersion: "0.0.1",
    manifestVersion: "1",
    branch: "stable",
    permissions: [
      {
        method: "*",
      },
    ],
    domains: ["https://*"],
    categories: ["tools"],
    currencies: "*",
    content: {
      shortDescription: {
        en: "Dummy live app for use in Manual and Automated Testing (Playwright E2E tests)",
      },
      description: {
        en: "Simple boilerplate Tuto Live App. Use at your own risk.",
      },
    },
    visibility: "complete",
  };
}
