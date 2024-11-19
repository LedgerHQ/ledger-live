export type AppStorageInfo = {
  size: number;
  dataVersion: string;
  hasSettings: boolean;
  hasData: boolean;
  hash: string;
};

export function isAppStorageInfo(data: AppStorageInfo | unknown): data is AppStorageInfo {
  return (
    typeof data === "object" &&
    data !== null &&
    "size" in data &&
    typeof data.size === "number" &&
    "dataVersion" in data &&
    typeof data.dataVersion === "string" &&
    "hasSettings" in data &&
    typeof data.hasSettings === "boolean" &&
    "hasData" in data &&
    typeof data.hasData === "boolean" &&
    "hash" in data &&
    typeof data.hash === "string"
  );
}
