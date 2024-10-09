import os from "os";

const platformMap: Record<string, string | undefined> = {
  darwin: "Mac",
  win32: "Windows",
  linux: "Linux",
};

export function useInstanceName(): string {
  const platform = os.platform();
  const hostname = os.hostname();
  const name = `${platformMap[platform] || platform}${hostname ? " " + hostname : ""}`;
  return name;
}
