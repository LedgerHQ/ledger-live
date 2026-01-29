import { CustomModule } from "@ledgerhq/wallet-api-client";
import { FeatureFlagGetParams, FeatureFlagGetResult, Feature } from "./types";

export * from "./types";

export class FeatureFlagModule extends CustomModule {
  /**
   * Fetch feature flags from Ledger Live.
   *
   * The Live App must declare which feature flags it can access via the
   * `featureFlags` array in its manifest. Only declared flags will be returned.
   *
   * @param featureFlagIds - Array of feature flag IDs to fetch
   * @returns A record mapping feature flag IDs to their values, or null if not found/unauthorized
   *
   * @example
   * ```typescript
   * const result = await featureFlagModule.get(["stakePrograms", "earnLidoStaking"]);
   * if (result.features.stakePrograms?.enabled) {
   *   // Feature is enabled
   * }
   * ```
   */
  async get(featureFlagIds: string[]): Promise<Record<string, Feature<unknown> | null>> {
    const result = await this.request<FeatureFlagGetParams, FeatureFlagGetResult>(
      "custom.featureFlags.get",
      {
        featureFlagIds,
      },
    );
    return result.features;
  }
}
