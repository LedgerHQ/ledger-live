import os from "os";
import {
  getDeviceFirmwareVersion,
  getSpeculosModel,
} from "@ledgerhq/live-common/e2e/speculosAppVersion";
import { ContentType, LabelName, Stage, Status, type StatusDetails } from "allure-js-commons";
import { getMessageAndTraceFromError } from "allure-js-commons/sdk";
import type { EnvironmentInfo } from "allure-js-commons/sdk";
import { FileSystemWriter, ReporterRuntime } from "allure-js-commons/sdk/reporter";
import { MaestroProject } from "../config/projects";
import { ALLURE_RESULTS_DIR } from "./paths";

// Mirrors the Detox suite (e2e/mobile/jest.config.js) so both report flavours
// link the same way and read the same in the Allure UI.
const JIRA_URL_TEMPLATE = "https://ledgerhq.atlassian.net/browse/%s";
const PARENT_SUITE = "Ledger Wallet Mobile (Maestro)";

function toStatusDetails(error: unknown): StatusDetails {
  const normalized = error instanceof Error ? error : new Error(String(error));
  return getMessageAndTraceFromError(normalized);
}

/**
 * Emits Allure results for the Maestro POC the same way the Detox suite does,
 * but built directly on the Allure JS reporter SDK (`ReporterRuntime`) since the
 * POC has no test framework to host `jest-allure2-reporter`. One Allure test is
 * produced per spec; native Maestro flows and WebView driver ops are recorded as
 * steps via the module-level {@link allureStep} helper.
 */
export class MaestroAllureReporter {
  private readonly runtime: ReporterRuntime;
  private currentTestUuid?: string;

  constructor(private readonly project: MaestroProject) {
    this.runtime = new ReporterRuntime({
      writer: new FileSystemWriter({ resultsDir: ALLURE_RESULTS_DIR }),
      links: {
        issue: { nameTemplate: "%s", urlTemplate: JIRA_URL_TEMPLATE },
        tms: { nameTemplate: "%s", urlTemplate: JIRA_URL_TEMPLATE },
      },
      globalLabels: [
        { name: LabelName.PARENT_SUITE, value: PARENT_SUITE },
        { name: LabelName.SUITE, value: project.id },
        { name: LabelName.FRAMEWORK, value: "maestro" },
        { name: LabelName.LANGUAGE, value: "typescript" },
        { name: LabelName.HOST, value: process.env.RUNNER_NAME || os.hostname() },
        { name: LabelName.THREAD, value: String(process.pid) },
      ],
    });
  }

  /** Writes `environment.properties`, mirroring the Detox `environment` block. */
  async writeEnvironmentInfo(): Promise<void> {
    const environmentInfo: EnvironmentInfo = {
      SPECULOS_DEVICE: process.env.SPECULOS_DEVICE ?? "unknown",
      SPECULOS_FIRMWARE_VERSION: await this.resolveFirmwareVersion(),
      PLATFORM: this.project.platform,
      PROJECT: this.project.id,
      APP_ID: this.project.appId,
      "version.node": process.version,
    };
    this.runtime.environmentInfo = environmentInfo;
    this.runtime.writeEnvironmentInfo();
  }

  startTest(name: string): void {
    const fullName = `e2e/maestro/specs/${name}.ts#${name}`;
    this.currentTestUuid = this.runtime.startTest({
      name,
      fullName,
      // Keep history stable per spec + platform, like the Detox historyId.
      historyId: `${fullName}:${this.project.platform}`,
      stage: Stage.RUNNING,
      labels: [
        { name: LabelName.FEATURE, value: name },
        { name: LabelName.TAG, value: this.project.platform },
      ],
    });
  }

  endTest(error?: unknown): void {
    const uuid = this.currentTestUuid;
    if (!uuid) return;
    const failed = error !== undefined && error !== null;
    this.runtime.updateTest(uuid, result => {
      result.stage = Stage.FINISHED;
      // Detox collapses "broken" into "failed"; we do the same for any throw.
      result.status = failed ? Status.FAILED : Status.PASSED;
      if (failed) {
        result.statusDetails = toStatusDetails(error);
      }
    });
    this.runtime.stopTest(uuid);
    this.runtime.writeTest(uuid);
    this.currentTestUuid = undefined;
  }

  /** Records `fn` as an Allure step bound to the running test (no-op if none). */
  async step<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const root = this.currentTestUuid;
    if (!root) return fn();

    const stepUuid = this.runtime.startStep(root, undefined, { name });
    if (!stepUuid) return fn();

    try {
      const result = await fn();
      this.runtime.updateStep(stepUuid, step => {
        step.status = Status.PASSED;
      });
      return result;
    } catch (error) {
      this.runtime.updateStep(stepUuid, step => {
        step.status = Status.FAILED;
        step.statusDetails = toStatusDetails(error);
      });
      throw error;
    } finally {
      this.runtime.stopStep(stepUuid);
    }
  }

  /** Attaches content to the current step (or the test when no step is open). */
  attach(name: string, content: string | Buffer, contentType: string): void {
    const root = this.currentTestUuid;
    if (!root) return;
    const buffer = typeof content === "string" ? Buffer.from(content) : content;
    this.runtime.writeAttachment(root, undefined, name, buffer, { contentType });
  }

  private async resolveFirmwareVersion(): Promise<string> {
    if (process.env.SPECULOS_FIRMWARE_VERSION) return process.env.SPECULOS_FIRMWARE_VERSION;
    try {
      return await getDeviceFirmwareVersion(getSpeculosModel());
    } catch {
      return "unknown";
    }
  }
}

// The runtime helpers (native flows, WebView driver) report steps without having
// the reporter threaded through every constructor. When no run is active (unit
// runs, typecheck) the helpers below degrade to plain pass-through.
let activeReporter: MaestroAllureReporter | undefined;

export function setActiveReporter(reporter: MaestroAllureReporter | undefined): void {
  activeReporter = reporter;
}

export function allureStep<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return activeReporter ? activeReporter.step(name, fn) : fn();
}

export function allureAttach(
  name: string,
  content: string | Buffer,
  contentType: string = ContentType.TEXT,
): void {
  activeReporter?.attach(name, content, contentType);
}
