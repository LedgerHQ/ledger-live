import { join } from "path";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import { Page } from "@playwright/test";

export const responseLogfilePath = join(__dirname, "../artifacts/networkResponses.log");

interface NetworkRequest {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  size?: number;
  status?: number;
  error?: string;
  timeout?: boolean;
}

interface ThroughputStats {
  totalBytes: number;
  totalRequests: number;
  averageResponseTime: number;
  throughputMbps: number;
  startTime: number;
  endTime: number;
  duration: number;
  // Statistiques de connectivité
  connectionErrors: number;
  timeouts: number;
  failedRequests: number;
  lastSuccessfulRequest?: number;
  connectionDowntime: number; // en millisecondes
}

class NetworkThroughputLogger {
  private requests: Map<string, NetworkRequest> = new Map();
  private stats: ThroughputStats;
  private logFile: string;
  private connectionTimeoutMs: number = 30000; // 30 secondes
  private lastRequestTime: number = 0;
  private connectionDownStartTime: number = 0;
  private isConnectionDown: boolean = false;
  private liveAppStartTime: number = 0;
  private liveAppTimeoutMs: number = 60000; // 60 secondes pour les live apps
  private currentTestName: string = "unknown";

  constructor(testInfo: any) {
    this.logFile = join(testInfo.outputDir, "network-throughput.log");
    this.stats = {
      totalBytes: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      throughputMbps: 0,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      connectionErrors: 0,
      timeouts: 0,
      failedRequests: 0,
      connectionDowntime: 0,
    };

    // Créer le dossier artifacts s'il n'existe pas
    const artifactsDir = join(__dirname, "../artifacts");
    if (!existsSync(artifactsDir)) {
      mkdirSync(artifactsDir, { recursive: true });
    }
  }

  setCurrentTest(testName: string) {
    this.currentTestName = testName;
  }

  startMonitoring(page: Page, electronApp?: any) {
    // Monitoring des live apps/WebView si electronApp est fourni
    if (electronApp) {
      this.monitorLiveApps(electronApp);
    }

    // Timer pour vérifier périodiquement l'état de la connexion
    const connectionCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      // Si plus de 10 secondes sans requête, vérifier l'état
      if (timeSinceLastRequest > 10000 && this.lastRequestTime > 0) {
        // Essayer une requête de ping simple pour tester la connexion
        this.checkConnectionHealth(page);
      }
    }, 5000); // Vérifier toutes les 5 secondes

    // Nettoyer l'intervalle quand le test se termine
    page.context().on("close", () => {
      clearInterval(connectionCheckInterval);
    });

    // Monitoring réseau minimal - seulement pour les stats
    page.on("request", request => {
      const now = Date.now();
      const requestId = `${request.url()}-${now}`;

      this.requests.set(requestId, {
        url: request.url(),
        method: request.method(),
        startTime: now,
      });

      this.lastRequestTime = now;

      // Vérifier si la connexion était down et vient de revenir (seulement si détecté)
      if (this.isConnectionDown) {
        const downtimeDuration = now - this.connectionDownStartTime;
        this.stats.connectionDowntime += downtimeDuration;
        this.log(`🔄 NETWORK CONNECTION RESTORED after ${this.formatDuration(downtimeDuration)}`);
        this.isConnectionDown = false;
      }
    });

    // Monitoring des réponses - seulement les erreurs importantes
    page.on("response", async response => {
      const request = response.request();
      const startTime = this.findRequestStartTime(request.url());

      try {
        const bodySize = await this.getResponseBodySize(response);
        const endTime = Date.now();

        if (startTime) {
          const responseTime = endTime - startTime;

          // SEULEMENT les erreurs HTTP importantes (pas les logs de succès)
          if (response.status() >= 400) {
            this.stats.connectionErrors += 1;
            this.log(`❌ HTTP ERROR ${response.status()}: ${request.method()} ${request.url()} (${responseTime}ms) [TEST: ${this.currentTestName}]`);
          }

          this.stats.totalBytes += bodySize;
          this.stats.totalRequests += 1;
          this.stats.lastSuccessfulRequest = endTime;

          // Mettre à jour la moyenne des temps de réponse
          const currentAvg = this.stats.averageResponseTime;
          this.stats.averageResponseTime =
            (currentAvg * (this.stats.totalRequests - 1) + responseTime) / this.stats.totalRequests;
        }
      } catch (error) {
        this.stats.connectionErrors += 1;
        this.log(`❌ RESPONSE ERROR: ${request.url()} - ${error} [TEST: ${this.currentTestName}]`);
      }
    });

    // Monitoring des échecs réseau importants
    page.on("requestfailed", request => {
      const now = Date.now();
      const startTime = this.findRequestStartTime(request.url());

      this.stats.failedRequests += 1;

      if (startTime) {
        const duration = now - startTime;

        // Détecter les vrais problèmes réseau (timeouts > 30s)
        if (duration > this.connectionTimeoutMs) {
          this.stats.timeouts += 1;
          this.log(`⏰ NETWORK TIMEOUT: ${request.method()} ${request.url()} (${duration}ms) [TEST: ${this.currentTestName}]`);

          // Marquer la connexion comme down
          if (!this.isConnectionDown) {
            this.isConnectionDown = true;
            this.connectionDownStartTime = now;
            this.log(`🔴 NETWORK DOWN detected [TEST: ${this.currentTestName}]`);
          }
        }
        // Les autres échecs (404, etc.) ne sont pas loggés pour éviter le spam
      }
    });
  }

  private findRequestStartTime(url: string): number {
    // Trouver la requête correspondante (approximation basée sur l'URL)
    const entries = Array.from(this.requests.entries());
    for (const [id, request] of entries) {
      if (request.url === url && !request.endTime) {
        request.endTime = Date.now();
        return request.startTime;
      }
    }
    return Date.now(); // Fallback si pas trouvée
  }

  private async getResponseBodySize(response: any): Promise<number> {
    try {
      const body = await response.body();
      return body.length;
    } catch {
      // Si on ne peut pas lire le body, estimer la taille depuis les headers
      const contentLength = response.headers()["content-length"];
      return contentLength ? parseInt(contentLength, 10) : 0;
    }
  }

  private formatBytesPerSecond(bytes: number, milliseconds: number): string {
    const seconds = milliseconds / 1000;
    const bytesPerSecond = bytes / seconds;
    const mbps = (bytesPerSecond * 8) / (1024 * 1024); // Convertir en Mbps
    return `${mbps.toFixed(2)} Mbps`;
  }

  private log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    try {
      appendFileSync(this.logFile, logMessage);
    } catch (error) {
      console.error("Failed to write log:", error);
    }

    // Afficher seulement les logs critiques dans la console CI
    if (message.includes('❌') || message.includes('⏰') || message.includes('🔴') || message.includes('🔄') ||
        message.includes('📱') || message.includes('⚠️') || message.includes('LIVE APP TIMEOUT')) {
      console.log(`[LIVEAPP] ${message}`);
    }
  }

  getStats(): ThroughputStats {
    this.stats.endTime = Date.now();
    this.stats.duration = this.stats.endTime - this.stats.startTime;

    if (this.stats.duration > 0 && this.stats.totalBytes > 0) {
      const totalSeconds = this.stats.duration / 1000;
      const bitsPerSecond = (this.stats.totalBytes * 8) / totalSeconds;
      this.stats.throughputMbps = bitsPerSecond / (1024 * 1024);
    }

    return { ...this.stats };
  }

  generateReport(): string {
    const stats = this.getStats();

    // Rapport simplifié concentré sur les problèmes critiques
    let issues = [];
    if (stats.connectionErrors > 0) issues.push(`${stats.connectionErrors} HTTP errors`);
    if (stats.timeouts > 0) issues.push(`${stats.timeouts} timeouts`);
    if (stats.connectionDowntime > 0) issues.push(`${this.formatDuration(stats.connectionDowntime)} downtime`);

    return `=== LIVE APP MONITORING ===
${issues.length > 0 ? `🚨 ISSUES: ${issues.join(', ')}` : '✅ NO CRITICAL ISSUES DETECTED'}
=====================================`;
  }

  private monitorLiveApps(electronApp: any) {
    this.liveAppStartTime = Date.now();
    this.log(`📱 LIVE APP MONITORING STARTED [TEST: ${this.currentTestName}]`);

    // Monitor WebView windows
    const webviewCheckInterval = setInterval(async () => {
      try {
        const windows = electronApp.windows();
        const webviewWindows = windows.filter((w: any, index: number) => index > 0); // Skip main window

        if (webviewWindows.length > 0) {
          this.log(`📱 ${webviewWindows.length} WebView window(s) detected`);

          for (let i = 0; i < webviewWindows.length; i++) {
            const webview = webviewWindows[i];
            try {
              // Check if WebView is responsive
              const title = await webview.title();
              const url = await webview.url();

              if (title || url) {
                this.log(`✅ WebView ${i + 1} responsive - Title: "${title}" URL: ${url}`);
              } else {
                this.log(`⚠️  WebView ${i + 1} detected but not fully loaded yet`);
              }
            } catch (error) {
              this.log(`❌ WebView ${i + 1} error: ${error} [TEST: ${this.currentTestName}]`);
            }
          }
        } else {
          // Check timeout for live app loading
          const elapsed = Date.now() - this.liveAppStartTime;
          if (elapsed > this.liveAppTimeoutMs) {
            this.log(`⏰ LIVE APP TIMEOUT: No WebView detected after ${this.formatDuration(elapsed)} [TEST: ${this.currentTestName}]`);
          } else if (elapsed > 10000) { // Log every 10 seconds if no WebView yet
            this.log(`⏳ Waiting for WebView... (${Math.round(elapsed/1000)}s elapsed) [TEST: ${this.currentTestName}]`);
          }
        }
      } catch (error) {
        this.log(`❌ Error checking WebView windows: ${error}`);
      }
    }, 5000); // Check every 5 seconds

    // Cleanup
    electronApp.on('close', () => {
      clearInterval(webviewCheckInterval);
      this.log(`📱 LIVE APP MONITORING ENDED [TEST: ${this.currentTestName}]`);
    });
  }

  private async checkConnectionHealth(page: Page) {
    try {
      // Faire une requête simple vers un endpoint fiable pour tester la connexion
      const startTime = Date.now();
      await page.request.get("https://www.google.com/favicon.ico", { timeout: 5000 });
      const responseTime = Date.now() - startTime;

      if (this.isConnectionDown) {
        const downtimeDuration = startTime - this.connectionDownStartTime;
        this.stats.connectionDowntime += downtimeDuration;
        this.log(
          `🔄 CONNECTION RESTORED after ${this.formatDuration(downtimeDuration)} (${responseTime}ms ping)`,
        );
        this.isConnectionDown = false;
      }
    } catch (error) {
      if (!this.isConnectionDown) {
        this.isConnectionDown = true;
        this.connectionDownStartTime = Date.now();
        this.log(`🔴 CONNECTION DOWN detected - ${error}`);
      }
    }
  }

  private formatBytes(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  private formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }

    const seconds = milliseconds / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }

    const minutes = seconds / 60;
    if (minutes < 60) {
      return `${minutes.toFixed(1)}m`;
    }

    const hours = minutes / 60;
    return `${hours.toFixed(1)}h`;
  }
}

export { NetworkThroughputLogger };
export type { ThroughputStats };
