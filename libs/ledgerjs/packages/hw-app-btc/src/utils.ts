import semver from "semver";
import type Transport from "@ledgerhq/hw-transport";
import { getAppAndVersion } from "./getAppAndVersion";


export async function shouldUseOlderZcash(transport: Transport): Promise<boolean> {
  let useOlderZcash = false;
  try {
    const { name, version } = await getAppAndVersion(transport);
    console.log({ name, version });

    if (name != "Zcash") return false;
    const coercedVersion = semver.coerce(version);
    console.log({ name, version, coercedVersion });
    if (semver.lt(coercedVersion, "2.3.2")) {
      console.log("Zcash version is older than 2.3.2");
      useOlderZcash = true;
    }
  } catch (e: any) {
    console.log("Error getting app version", e);
    if (e.statusCode === 0x6d00) {
      useOlderZcash = false;
    } else {
      throw e;
    }
  }
  return useOlderZcash;
}
