import { CustomModule } from "@ledgerhq/wallet-api-client";
import { DeeplinkOpenParams } from "./types";

export * from "./types";

export class DeeplinkModule extends CustomModule {
  /**
   * Open a deeplink
   * @param url - the url to open
   *
   * @returns - void
   */
  async open(url: string) {
    await this.request<DeeplinkOpenParams, void>("custom.deeplink.open", {
      url,
    });
  }
}
