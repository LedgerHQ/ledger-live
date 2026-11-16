type LinkParams = Readonly<Record<string, string | undefined>>;
type HostInputs = Readonly<Record<string, string>>;

function parseURL(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

/**
 * The inputs of the Predictions webview: the deep link's params, then the host context (theme,
 * platform, …), which a link param can't override. Ledger Wallet loads a whitelisted `goToURL` as
 * is, without the other inputs, so they're added to its query too.
 */
export function getPredictionsWebviewInputs(
  linkParams: LinkParams,
  hostInputs: HostInputs,
): Record<string, string | undefined> {
  const { goToURL, ...params } = linkParams;
  const inputs = { ...params, ...hostInputs };
  const url = goToURL === undefined ? undefined : parseURL(goToURL);
  if (url === undefined) return inputs;

  for (const [key, value] of Object.entries(inputs)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return { ...inputs, goToURL: url.toString() };
}
