export type ChainwatchNetwork = {
    ledgerLiveId: string;
    chainwatchId: string;
    nbConfirmations: number;
};

export type ChainwatchTarget = {
    equipment: string;
    type: "braze";
    id: number;
};

export type ChainwatchMonitor = {
    confirmations: number;
    type: "send" | "receive";
    id: number;
};

export type ChainwatchAccount = {
    suffixes: string[];
    targets: ChainwatchTarget[];
    monitors: ChainwatchMonitor[];
}
