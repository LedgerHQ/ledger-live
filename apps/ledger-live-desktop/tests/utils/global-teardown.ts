import XrayService from "./xray.service";

export default async function globalTeardown() {
  if (process.env.CI && process.env.XRAY) {
    await XrayService.importExecution("tests/artifacts/xray/xml-report.xml");
  }
}
