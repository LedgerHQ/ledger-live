export function openHostedLoginInBrowser(loginUrl: string): void {
  const opened = window.open(loginUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    throw new Error("Unable to start login");
  }
}
