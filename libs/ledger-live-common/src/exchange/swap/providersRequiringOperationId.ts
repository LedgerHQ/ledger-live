const PROVIDERS_REQUIRING_OPERATION_ID: ReadonlySet<string> = new Set([
  "thorswap",
  "lifi",
  "nearintents",
  "swapsxyz",
  "moonpay_trade",
]);

export function swapProviderRequiresOperationId(provider: string): boolean {
  return PROVIDERS_REQUIRING_OPERATION_ID.has(provider);
}
