export type NoahAuthPath = "/auth/signup" | "/auth/signin";

export type NoahGoToURLParams = Readonly<{
  lang?: string;
  theme?: string;
}>;

export function getNoahGoToURL(
  manifestUrl: string | undefined,
  authPath: NoahAuthPath | undefined,
  params?: NoahGoToURLParams,
): string | undefined {
  if (!manifestUrl || !authPath) return undefined;
  try {
    const url = new URL(manifestUrl);
    url.pathname = authPath;
    if (params?.theme) url.searchParams.set("theme", params.theme);
    if (params?.lang) url.searchParams.set("lang", params.lang);
    return url.toString();
  } catch {
    return undefined;
  }
}
