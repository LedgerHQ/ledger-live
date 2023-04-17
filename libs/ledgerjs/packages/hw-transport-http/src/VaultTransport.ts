import { log } from "@ledgerhq/logs";
import WebSocketTransport from "./WebSocketTransport";

type VaultData = {
  token: string;
  workspace: string;
};

export default class VaultTransport extends WebSocketTransport {
  protected data: VaultData | null;

  constructor(hook: any) {
    super(hook);
    this.data = null;
  }

  setData(data: VaultData): void {
    this.data = data;
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    const hex = apdu.toString("hex");
    log("apdu", "=> " + hex);
    const res: Buffer = await new Promise((resolve, reject) => {
      this.hook.rejectExchange = (e: any) => reject(e);

      this.hook.resolveExchange = (b: Buffer) => resolve(b);
      const data = {
        workspace: this.data?.workspace,
        token: this.data?.token,
        apdu: hex,
      };

      this.hook.send(JSON.stringify(data));
    });
    log("apdu", "<= " + res.toString("hex"));
    return res;
  }
}
