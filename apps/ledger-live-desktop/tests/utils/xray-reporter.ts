import type { Reporter } from "@playwright/test/reporter";
import XrayService from "./xray.service";

class XrayReporter implements Reporter {
  onExit(): Promise<any> {
    if (process.env.CI && process.env.XRAY) {
      return XrayService.importExecution("tests/artifacts/xray/xml-report.xml");
    } else {
      return Promise.resolve();
    }
  }
}

export default XrayReporter;
