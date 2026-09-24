import * as braze from "@braze/web-sdk";

type BrazeLifecycleMethodName = "wipeData" | "enableSDK";

function getBrazeSdk(): Record<string, unknown> {
  const sdk = braze as Record<string, unknown> & { default?: Record<string, unknown> };
  if (sdk.default && typeof sdk.default === "object") {
    return sdk.default;
  }
  return sdk;
}

export function requireBrazeLifecycleMethod(
  methodName: BrazeLifecycleMethodName,
): () => Promise<void> {
  const brazeSdk = getBrazeSdk();
  const method = brazeSdk[methodName];
  if (typeof method !== "function") {
    throw new TypeError(`Braze SDK is missing ${methodName}`);
  }

  const boundMethod = (method as () => void | Promise<void>).bind(brazeSdk);
  return () => Promise.resolve(boundMethod());
}
