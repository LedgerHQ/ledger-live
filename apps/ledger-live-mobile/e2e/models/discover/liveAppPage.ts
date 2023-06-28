import { web, by } from "detox";
import { getElementById } from "../../helpers";

export default class LiveAppPage {
  liveAppWebview = () => getElementById("live-app-webview");

  //   verifyTextIsPresentInUrl(appName: string) {
  //     return web.element(by.web.hrefContains(appName));
  //   }

  verifyTextIsPresentInUrl(appName: string) {
    return web.element(by.web.hrefContains(appName));
  }
}
