import { LiveAppManifest } from "./types";

function getProtectManifest(env: "staging" | "simu" | "sec"): LiveAppManifest {
  const protectURLs = {
    staging: "https://protect-frontend-stg.aws.stg.ldg-tech.com",
    simu: "https://protect-frontend-simu-stg.aws.stg.ldg-tech.com",
    sec: "https://protect-frontend.aws.sec.ldg-tech.com",
  };

  let id = "protect";

  if (env !== "sec") id += `-${env}`;

  return {
    id,
    name: `Protect ${env.charAt(0).toUpperCase() + env.slice(1)}`,
    private: true,
    url: protectURLs[env],
    homepageUrl: "",
    icon: "",
    platform: "mobile",
    apiVersion: "^2.0.0 || ^1.0.0",
    manifestVersion: "1",
    branch: "experimental",
    content: {
      shortDescription: {
        en: "Never lose access to your assets with Ledger Protect.",
      },
      description: {
        en: "Never lose access to your assets with Ledger Protect.",
      },
    },
    permissions: [
      {
        method: "*",
      },
    ],
    currencies: "*",
    domains: ["https://*.aws.*.ldg-tech.com", "http://*.aws.*.ldg-tech.com"],
  } as LiveAppManifest;
}

export default getProtectManifest;
