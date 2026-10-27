import type { PiiFinding } from "./types";

export class AnalyticsPiiError extends Error {
  override name = "AnalyticsPiiError";
  readonly findings: PiiFinding[];

  constructor(eventName: string, findings: PiiFinding[]) {
    const found = findings.map(({ path, kind }) => `${path} (${kind})`).join(", ");
    super(`Analytics event "${eventName}" contains personal data: ${found}`);
    this.findings = findings;
  }
}
