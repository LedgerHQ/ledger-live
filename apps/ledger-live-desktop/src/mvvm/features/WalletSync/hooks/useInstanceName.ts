import { osHostname, osPlatform } from "~/system";

const platformMap: Record<string, string | undefined> = {
  darwin: "Mac",
  win32: "Windows",
  linux: "Linux",
};

export function useInstanceName(): string {
  const platform = osPlatform();
  const hostname = osHostname();
  const name = `${platformMap[platform] || platform}${hostname ? " " + hostname : ""}`;
  return name;
}
