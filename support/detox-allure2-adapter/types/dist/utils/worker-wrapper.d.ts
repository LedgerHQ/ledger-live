export declare class WorkerWrapper {
    private readonly worker;
    constructor(worker: any);
    get asyncWebSocket(): AsyncWebSocket;
    get eventEmitter(): EventEmitter;
    get artifactsManager(): ArtifactsManager;
    get xcuitestRunner(): XCUITestRunner | undefined;
}
interface EventEmitter {
    on(event: 'beforeLaunchApp', callback: (event: {
        bundleId: string;
        deviceId: string;
        launchArgs: Record<string, any>;
    }) => void): void;
    on(event: 'launchApp', callback: (event: {
        pid: number;
    }) => void): void;
    on(event: 'terminateApp', callback: () => void): void;
    on(event: 'createExternalArtifact', callback: (event: {
        pluginId: string;
        artifactName: string;
        artifactPath: string;
    }) => void): void;
}
type ArtifactPluginKey = 'instruments' | 'log' | 'screenshot' | 'video' | 'uiHierarchy';
interface ArtifactsManager {
    _artifactPlugins: Record<ArtifactPluginKey, ArtifactPlugin | undefined>;
    _callPlugins: (...args: unknown[]) => Promise<void>;
    _callSinglePlugin: (...args: unknown[]) => Promise<void>;
}
interface ArtifactPlugin {
    _registerSnapshot?: (...args: unknown[]) => unknown;
}
interface AsyncWebSocket {
    send: (...args: any[]) => Promise<WebSocketResult>;
}
interface XCUITestRunner {
    execute: (...args: any[]) => Promise<{
        type?: string;
    }>;
}
export interface WebSocketResult {
    type?: string;
    params?: {
        viewHierarchy?: string;
        viewHierarchyURL?: string;
        NSLocalizedDescription?: string;
        details?: string;
        DetoxFailureInformation?: {
            lineNumber?: number;
            file?: string;
            functionName?: string;
        };
    };
}
export {};
