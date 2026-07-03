import { EnvName } from "@ledgerhq/live-env";
import { type Feature, type FeatureId } from "@shared/feature-flags";
export declare function sleep(ms: number): Promise<void>;
export declare const formatFlagsData: (data: Partial<{ [key in FeatureId]: Feature; }>) => string;
export declare const formatEnvData: (data: { [key in EnvName]: unknown; }) => string;
/**
 * Sanitizes an error to remove circular references (e.g., from AxiosError objects).
 * This prevents Jest serialization failures when processing test results.
 * Always returns a clean Error object with only serializable properties.
 */
export declare const sanitizeError: (error: unknown) => Error;
//# sourceMappingURL=index.d.ts.map