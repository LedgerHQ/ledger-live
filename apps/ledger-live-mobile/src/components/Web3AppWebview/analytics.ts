import { getCurrentTrackingPage } from "~/analytics/screenRefs";

export const getTrackingRouteLiveAppSource = (): string => {
  const page = getCurrentTrackingPage({ fallback: "Unknown" });
  return page === "Platform Catalog" ? "Discover" : page;
};
