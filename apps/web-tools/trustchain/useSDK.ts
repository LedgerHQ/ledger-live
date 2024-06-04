import { getSdk } from "@ledgerhq/trustchain";
import useEnv from "./useEnv";

export default function useSDK() {
  const mock = useEnv("MOCK");
  return getSdk();
}
