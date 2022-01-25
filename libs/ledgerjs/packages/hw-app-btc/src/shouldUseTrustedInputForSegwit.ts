import semver from "semver";
export function shouldUseTrustedInputForSegwit({
  version,
  name,
}: {
  version: string;
  name: string;
}): boolean {
  if (name === "Decred") return false;
  if (name === "Exchange") return true;
  return semver.gte(version, "1.4.0");
}
