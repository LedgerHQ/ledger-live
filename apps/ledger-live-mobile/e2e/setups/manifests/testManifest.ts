import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

export function getTestManifest(): LiveAppManifest {
  return {
    id: "dummy-wallet-app",
    name: "Dummy test App",
    url: "http://localhost:3000",
    homepageUrl: "https://dev.ledger.com",
    platforms: ["ios", "android", "desktop"],
    apiVersion: "2.0.0",
    manifestVersion: "1",
    branch: "debug",
    permissions: [
      {
        method: "*",
      },
    ],
    domains: ["http://*"],
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
