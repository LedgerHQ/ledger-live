/**
 * Retries any Axios-based async call on transient failures: retryable HTTP statuses,
 * no-response network errors, common Node socket codes, or "socket hang up"
 * (speculos-device-controller / remote Speculos).
 */
export declare function retryAxiosRequest<T>(requestFn: () => Promise<T>, maxRetries?: number, baseDelay?: number, retryableStatusCodes?: number[]): Promise<T>;
//# sourceMappingURL=retryAxiosRequest.d.ts.map