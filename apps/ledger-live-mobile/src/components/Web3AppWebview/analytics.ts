import { getCurrentTrackingPage } from "@shared/analytics";

export const getTrackingRouteLiveAppSource = (): string => {
  const page = getCurrentTrackingPage({ fallback: "Unknown" });
  return page === "Platform Catalog" ? "Discover" : page;
};
