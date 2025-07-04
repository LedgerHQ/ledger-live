import * as core from "@actions/core";
import { synthetics, utils } from "@datadog/datadog-ci";

/**
 * This function is used to resolve the config for the Datadog Synthetics Tests by
 * getting the inputs from the Github Action and resolving the config.
 *
 * @returns
 * The config for the Datadog Synthetics Tests.
 */
export function resolveConfig(): synthetics.RunTestsCommandConfig {
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
    subdomain,
    defaultTestOverrides: mobileApplicationVersion ? { mobileApplicationVersion } : undefined,
  });

  const config = structuredClone(synthetics.DEFAULT_COMMAND_CONFIG);
  const finalConfig = {
    ...config,
    ...overrides,
  } as synthetics.RunTestsCommandConfig;

  core.info(`Final test config: ${JSON.stringify(finalConfig)}`);
  return finalConfig;
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
