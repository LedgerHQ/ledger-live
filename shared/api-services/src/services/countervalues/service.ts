import type { ApiServiceDescriptor } from "../../compose";
import { countervaluesApi, cvsApiExtra, type CountervaluesApi } from "./api";
import type { CvsApiExtra } from "./types";

export function cvsService(own: () => CvsApiExtra): ApiServiceDescriptor<CountervaluesApi> {
  return { api: countervaluesApi, buildExtra: () => cvsApiExtra(own()) };
}
