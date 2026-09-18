const TOP_UP_PATH = "/topup";

export function buildTopUpPath(usAppId?: string | null): string {
  return usAppId ? `${TOP_UP_PATH}?${new URLSearchParams({ app_id: usAppId })}` : TOP_UP_PATH;
}
