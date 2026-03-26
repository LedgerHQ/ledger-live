import { allure } from "jest-allure2-reporter/api";
import { isWallet40 } from "../commonHelpers";

export function setAllureDescription(): void {
  const testPath = expect.getState().testPath ?? "";
  const testFileName = testPath.replace(/^.*\/(.+?)(?:\.spec)?\.[^.]+$/, "$1") || "unknown";
  // Remove when Wallet 4.0 is default
  const isWallet40Test = isWallet40 || testPath.includes("/wallet40/");
  const mode = isWallet40Test ? "🆕 Wallet 4.0" : "Legacy Wallet";

  allure.description(`📄 Test file: ${testFileName}\n🏷️ Test run on: ${mode}`);
}
