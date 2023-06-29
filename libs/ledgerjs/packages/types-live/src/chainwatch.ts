export type ChainwatchNetwork = {
  ledgerLiveId: string;
  chainwatchId: string;
  nbConfirmations: number;
};

export type ChainwatchTargetType = "braze";

export type ChainwatchTarget = {
  equipment: string;
  type: ChainwatchTargetType;
  id: number;
};

export type ChainwatchMonitorType = "send" | "receive";

export type ChainwatchMonitor = {
  confirmations: number;
  type: ChainwatchMonitorType;
  id: number;
};

export type ChainwatchAccount = {
  suffixes: string[];
  targets: ChainwatchTarget[];
  monitors: ChainwatchMonitor[];
};
