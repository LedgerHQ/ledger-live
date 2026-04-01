export interface FaultConfig {
  /** Fixed delay added to every response (ms) */
  latencyMs: number;
  /** 0..1 probability of returning an error instead of the real response */
  errorRate: number;
  /** When true, some requests will receive no response (simulate timeout) */
  dropResponses: boolean;
}

export const NO_FAULTS: FaultConfig = {
  latencyMs: 0,
  errorRate: 0,
  dropResponses: false,
};

export function shouldDropResponse(config: FaultConfig): boolean {
  return config.dropResponses && Math.random() < 0.1;
}

export function shouldInjectError(config: FaultConfig): boolean {
  return config.errorRate > 0 && Math.random() < config.errorRate;
}

export async function applyLatency(config: FaultConfig): Promise<void> {
  if (config.latencyMs > 0) {
    await new Promise(resolve => setTimeout(resolve, config.latencyMs));
  }
}
