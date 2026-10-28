import type { ApiServiceDescriptor, CommonConfig } from "../../compose";
import { calApi, calApiExtra, type CalApi } from "./api";
import type { CalApiExtra } from "./types";

export function calService(
  own: () => Omit<CalApiExtra, keyof CommonConfig>,
): ApiServiceDescriptor<CalApi> {
  return { api: calApi, buildExtra: common => calApiExtra({ ...own(), ...common }) };
}
