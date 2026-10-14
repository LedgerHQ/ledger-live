import { getCurrentTrackingPage } from "@shared/analytics";

export function getTrackingRouteLiveAppSource(): string {
  const page = getCurrentTrackingPage({ fallback: "Unknown" });
  return page === "Platform Catalog" ? "Discover" : page;
}
