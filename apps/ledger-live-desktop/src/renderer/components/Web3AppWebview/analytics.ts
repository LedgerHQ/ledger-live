import { getCurrentTrackingPage } from "~/renderer/analytics/screenRefs";

export function getTrackingRouteLiveAppSource(): string {
  const page = getCurrentTrackingPage({ fallback: "Unknown" });
  return page === "Platform Catalog" ? "Discover" : page;
}
