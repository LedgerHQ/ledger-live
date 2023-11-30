import { LocalTracer } from "@ledgerhq/logs";

export default class APDUContext{
  public static currentContext = new LocalTracer("ipc-apdu");
};
