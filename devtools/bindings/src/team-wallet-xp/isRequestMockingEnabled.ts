export function isRequestMockingEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return process.env.MSW_ENABLED === "true" || process.env.ENABLE_MSW === "true";
}
