import type { PlatformName } from "../../types.ts";
import type { Maestro, Platform } from "../types.ts";
import { createAndroid } from "./android.ts";
import { createIos } from "./ios.ts";

export function createPlatform(
  name: PlatformName,
  { appId, maestro }: { appId: string; maestro: Maestro },
): Platform {
  return name === "android" ? createAndroid({ appId }) : createIos({ appId, maestro });
}
