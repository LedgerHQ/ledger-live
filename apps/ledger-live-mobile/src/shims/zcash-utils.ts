type NativeSyncArgs = {
  grpcUrl: string;
  viewingKey: string;
  startHeight: number;
  endHeight: number;
  network: string;
  orchardOnly: boolean;
  maxRetries: number;
};

function unsupported(): never {
  throw new Error(
    "@ledgerhq/zcash-utils is a native Node addon and cannot run in React Native. Use the JSON-RPC shielded sync path on mobile.",
  );
}

export class TransactionStream {
  next(): Promise<null> {
    unsupported();
  }

  stats(): Promise<{ blocksScanned: number; elapsedMs: number }> {
    unsupported();
  }

  cancel(): void {
    unsupported();
  }
}

export async function startSync(_args: NativeSyncArgs): Promise<TransactionStream> {
  unsupported();
}

export async function getChainTip(_grpcUrl: string): Promise<number> {
  unsupported();
}
