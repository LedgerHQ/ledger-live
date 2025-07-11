import {
  createConfiguration,
  HttpMethod,
  applySecurityAuthentication,
  type ConfigurationParameters,
  ResponseContext,
} from "@datadog/datadog-api-client";
import { v1 } from "@datadog/datadog-api-client-synthetics";
import type { MobileApplicationResponse, MobileApplicationVersion } from "../models/datadog";

/**
 * Unsafe implementation of the Datadog Synthetics Mobile Application API endpoint.
 *
 * Since datadog api and packages still not support the mobile application api officially,
 * we need to use this unsafe implementation. Should be removed once the mobile application
 * api is supported officially.
 */
export class DatadogSyntheticsMobileApplication {
  /** The Datadog API instance */
  private apiInstance: v1.SyntheticsApi;

  /**
   * Create a new Datadog Synthetics Mobile Application API instance
   *
   * @param options
   * The options for the Datadog Synthetics Mobile Application API
   */
  constructor({ apiKey, appKey, site }: DatadogSyntheticsMobileApplicationOptions) {
    const configurationOpts: ConfigurationParameters = {
      authMethods: {
        apiKeyAuth: apiKey,
        appKeyAuth: appKey,
      },
      serverVariables: {
        site,
      },
    };
    const configuration = createConfiguration(configurationOpts);
    this.apiInstance = new v1.SyntheticsApi(configuration);
  }

  /**
   * Get a mobile application version by version name
   *
   * @param appId
   * The ID of the mobile application
   *
   * @param versionName
   * The name of the version
   *
   * @returns
   * The mobile application version
   */
  async getMobileApplicationVersionByVersionName(
    appId: string,
    versionName: string,
  ): Promise<MobileApplicationVersion | undefined> {
    const apps = await this.getMobileApplications();
    const app = apps.applications.find(app => app.id === appId);
    if (!app) {
      throw new Error(`App with id ${appId} not found`);
    }

    const version = app.versions.find(version => version.version_name === versionName);
    return version;
  }

  /**
   * Get all mobile applications
   *
   * @returns
   * The mobile applications
   */
  async getMobileApplications(): Promise<MobileApplicationResponse> {
    const configuration = getConfiguration(this.apiInstance);

    // Each API call made to Datadog requires these specific steps
    // 1. Set the Datadog Path Params
    const localVarPath = "/api/unstable/synthetics/mobile/applications";

    // 2. Make Datadog Request Context
    const { server, overrides } = configuration.getServerAndOverrides(
      "SyntheticsApi.unstable.getAllMobileApplications",
      v1.SyntheticsApi.operationServers,
    );
    const requestContext = server.makeRequestContext(localVarPath, HttpMethod.GET, overrides);
    requestContext.setHeaderParam("Accept", "application/json");
    requestContext.setHttpConfig(configuration.httpConfig);

    // 3. Set Datadog User-Agent
    const userAgent = getUserAgent(this.apiInstance);
    if (userAgent) {
      requestContext.setHeaderParam("User-Agent", userAgent);
    }

    // 4. Set Datadog auth methods
    const authMethods = getAuthMethods(this.apiInstance);
    if (authMethods) {
      applySecurityAuthentication(configuration, requestContext, authMethods);
    }

    // 5. Apply Datadog auth methods
    applySecurityAuthentication(configuration, requestContext, [
      "AuthZ",
      "apiKeyAuth",
      "appKeyAuth",
    ]);

    return configuration.httpApi
      .send(requestContext)
      .then(async (responseContext: ResponseContext) => {
        const text = await responseContext.body.text();
        const json: MobileApplicationResponse = JSON.parse(text);
        return json;
      });
  }
}

/** Options for the Datadog Synthetics Mobile Application API */
export interface DatadogSyntheticsMobileApplicationOptions {
  /** The API key for the Datadog API */
  apiKey: string;
  /** The app key for the Datadog API */
  appKey: string;
  /** The site for the Datadog API */
  site: string;
}

// Unsafe private access to the Datadog API instance
function getConfiguration(apiInstance: v1.SyntheticsApi) {
  // @ts-expect-error: private property
  return apiInstance.configuration;
}

function getUserAgent(apiInstance: v1.SyntheticsApi) {
  // @ts-expect-error: private property
  return apiInstance.userAgent;
}

function getAuthMethods(apiInstance: v1.SyntheticsApi) {
  // @ts-expect-error: private property
  return apiInstance.authMethods;
}
