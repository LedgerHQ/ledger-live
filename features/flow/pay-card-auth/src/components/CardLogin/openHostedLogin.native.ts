import { openAuthSessionAsync } from "expo-web-browser";

export async function openHostedLoginInSecureBrowser(loginUrl: string): Promise<void> {
  await openAuthSessionAsync(loginUrl);
}
