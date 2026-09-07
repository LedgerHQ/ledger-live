import * as braze from "@braze/web-sdk";

type BrazeLifecycleMethodName = "wipeData" | "enableSDK";

function getBrazeSdk(): Record<string, unknown> {
  const sdk = braze as Record<string, unknown> & { default?: Record<string, unknown> };
  if (sdk.default && typeof sdk.default === "object") {
    return sdk.default;
  }
  return sdk;
}

export function requireBrazeLifecycleMethod(methodName: BrazeLifecycleMethodName): () => void {
  const brazeSdk = getBrazeSdk();
  const method = brazeSdk[methodName];
  if (typeof method !== "function") {
    throw new Error(`Braze SDK is missing ${methodName}`);
  }

  return (method as () => void).bind(brazeSdk);
}
