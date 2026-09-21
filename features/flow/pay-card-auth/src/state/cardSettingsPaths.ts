export const MANAGE_PIN_PATH = "/dashboard/card/details";

export function buildAccessBaanxPath(usAppId?: string | null): string {
  const query = new URLSearchParams();

  if (usAppId) query.set("app_id", usAppId);

  const search = query.toString();

  return search ? `/?${search}` : "/";
}
