import semver from "semver";
import type Transport from "@ledgerhq/hw-transport";
import { getAppAndVersion } from "./getAppAndVersion";

/*
FIXME: this temporary, remove once both LLM7 & LLDR8 are out
*/
export async function shouldUseOlderZcash(transport: Transport): Promise<boolean> {
  let useOlderZcash = false;
  try {
    const { name, version } = await getAppAndVersion(transport);

    if (name != "Zcash") return false;
    const coercedVersion = semver.coerce(version);
    if (semver.lt(coercedVersion, "2.3.2")) {
      useOlderZcash = true;
    }
  } catch (e: any) {
    if (e.statusCode === 0x6d00) {
      useOlderZcash = false;
    } else {
      throw e;
    }
  }
  return useOlderZcash;
}
