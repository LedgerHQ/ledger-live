import * as core from "@actions/core";
import { synthetics, utils } from "@datadog/datadog-ci";
import { ComparisonConfig } from "./models/config";

/**
 * This function is used to resolve the config for the Datadog Synthetics Tests by
 * getting the inputs from the Github Action and resolving the config.
 *
 * @returns
 * The config for the Datadog Synthetics Tests.
 */
export function resolveSyntheticsConfig(): synthetics.RunTestsCommandConfig {
  const apiKey = getDefinedInput("api-key");
  const appKey = getDefinedInput("app-key");
  const datadogSite = getDefinedInput("site");
  const publicIds = [getDefinedInput("public-id")];
  const subdomain = getOptionalInput("subdomain");
  const mobileApplicationVersion = getOptionalInput("mobile-application-version");
  const overrides = utils.removeUndefinedValues({
    apiKey,
    appKey,
    datadogSite,
    publicIds,
    ...(subdomain && { subdomain }),
    ...(mobileApplicationVersion && { defaultTestOverrides: { mobileApplicationVersion } }),
  });

  const config = structuredClone(synthetics.DEFAULT_COMMAND_CONFIG);
  const finalConfig: synthetics.RunTestsCommandConfig = {
    ...config,
    ...overrides,
  };

  core.info(
    [
      "Final test config:",
      `  - apiKey: ${apiKey ? "[REDACTED]" : undefined}`,
      `  - appKey: ${appKey ? "[REDACTED]" : undefined}`,
      `  - dataDogSite: ${datadogSite}`,
      `  - publicIds: ${publicIds.join(", ")}`,
      `  - subdomain: ${subdomain}`,
      `  - mobileApplicationVersion: ${mobileApplicationVersion ?? "latest"}`,
    ].join("\n"),
  );
  return finalConfig;
}

/**
 * Resolves the comparison configuration from GitHub Action inputs
 *
 * @returns
 * The comparison configuration if enabled, otherwise undefined
 */
export function resolveComparisonConfig(): ComparisonConfig | undefined {
  const applicationPlatform = getDefinedInput("mobile-application-platform");
  const applicationVersionName = getDefinedInput("mobile-application-version-name");
  const enabled = getOptionalInput("enable-comparison")?.toLowerCase() === "true";
  const baselineRepo = getOptionalInput("baseline-repo");
  const baselineWorkflow = getOptionalInput("baseline-workflow") || "release-mobile.yml";
  const githubToken = getOptionalInput("github-token") ?? process.env.GITHUB_TOKEN;

  if (!enabled) return;
  if (!baselineRepo) {
    throw new Error("baseline-repo is required when enable-comparison is true");
  }
  if (!githubToken) {
    throw new Error("github-token is required when enable-comparison is true");
  }

  const config: ComparisonConfig = {
    enabled,
    baselineRepo,
    baselineWorkflow,
    githubToken,
    applicationPlatform,
    applicationVersionName,
  };

  core.info(
    [
      "Comparison config:",
      `  - enabled: ${enabled}`,
      `  - applicationPlatform: ${applicationPlatform}`,
      `  - applicationVersionName: ${applicationVersionName}`,
      `  - baselineRepo: ${baselineRepo}`,
      `  - baselineWorkflow: ${baselineWorkflow}`,
      `  - githubToken: ${githubToken ? "[REDACTED]" : undefined}`,
    ].join("\n"),
  );

  return config;
}

/**
 * Gets the datadog main reporter.
 *
 * @returns
 * The main datadog synthetics test reporter
 */
export function getReporter(): synthetics.MainReporter {
  const reporters: synthetics.Reporter[] = [new synthetics.DefaultReporter({ context: process })];
  return synthetics.utils.getReporter(reporters);
}

/**
 * Gets a required input value passed to the running Github Action.
 *
 * @param name
 * Name of the Github Action input value to get
 *
 * @returns
 * The input value as string or makes the running Github Action fail and returns an error.
 */
function getDefinedInput(name: string): string {
  const input = core.getInput(name);
  if (input === "") {
    const error = Error(`Input ${name} is required`);
    core.setFailed(error);
    throw error;
  }
  return input;
}

/**
 * Gets an optionnal input value from the running Github Action.
 *
 * @param name
 * Name of the Github Action input value to get
 *
 * @returns
 * If not found the action will fails.
 */
function getOptionalInput(name: string): string | undefined {
  const input = core.getInput(name);
  return input === "" ? undefined : input;
}
