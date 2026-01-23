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

  startMonitoring(page: Page) {
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

    // Intercepter toutes les requêtes réseau
    page.on("request", request => {
      const now = Date.now();
      const requestId = `${request.url()}-${now}`;

      this.requests.set(requestId, {
        url: request.url(),
        method: request.method(),
        startTime: now,
      });

      this.lastRequestTime = now;
      this.log(`REQUEST: ${request.method()} ${request.url()}`);

      // Vérifier si la connexion était down et vient de revenir
      if (this.isConnectionDown) {
        const downtimeDuration = now - this.connectionDownStartTime;
        this.stats.connectionDowntime += downtimeDuration;
        this.log(`🔄 CONNECTION RESTORED after ${this.formatDuration(downtimeDuration)}`);
        this.isConnectionDown = false;
      }
    });

    // Intercepter toutes les réponses réseau
    page.on("response", async response => {
      const request = response.request();
      const requestId = `${request.url()}-${this.findRequestStartTime(request.url())}`;

      try {
        const bodySize = await this.getResponseBodySize(response);
        const endTime = Date.now();
        const startTime = this.findRequestStartTime(request.url());

        if (startTime) {
          const responseTime = endTime - startTime;

          // Vérifier les erreurs HTTP (codes 4xx, 5xx)
          if (response.status() >= 400) {
            this.stats.connectionErrors += 1;
            this.log(
              `❌ HTTP ERROR: ${response.status()} ${request.method()} ${request.url()} - ` +
                `${responseTime}ms - ${bodySize} bytes`,
            );
          } else {
            this.stats.lastSuccessfulRequest = endTime;
            this.log(
              `✅ RESPONSE: ${response.status()} ${request.method()} ${request.url()} - ` +
                `${bodySize} bytes in ${responseTime}ms (${this.formatBytesPerSecond(bodySize, responseTime)})`,
            );
          }

          this.stats.totalBytes += bodySize;
          this.stats.totalRequests += 1;

          // Mettre à jour la moyenne des temps de réponse
          const currentAvg = this.stats.averageResponseTime;
          this.stats.averageResponseTime =
            (currentAvg * (this.stats.totalRequests - 1) + responseTime) / this.stats.totalRequests;
        }
      } catch (error) {
        this.stats.connectionErrors += 1;
        this.log(`❌ RESPONSE ERROR for ${request.url()}: ${error}`);
      }
    });

    // Intercepter les échecs de requête (timeouts, connexion perdue, etc.)
    page.on("requestfailed", request => {
      const now = Date.now();
      const requestId = `${request.url()}-${this.findRequestStartTime(request.url())}`;
      const startTime = this.findRequestStartTime(request.url());

      this.stats.failedRequests += 1;

      if (startTime) {
        const duration = now - startTime;

        // Détecter les timeouts (requêtes qui prennent plus de 30 secondes)
        if (duration > this.connectionTimeoutMs) {
          this.stats.timeouts += 1;
          this.log(
            `⏰ TIMEOUT: ${request.method()} ${request.url()} - ${duration}ms (>${this.connectionTimeoutMs}ms)`,
          );

          // Marquer la connexion comme down si c'est la première fois
          if (!this.isConnectionDown) {
            this.isConnectionDown = true;
            this.connectionDownStartTime = now;
            this.log(`🔴 CONNECTION DOWN detected at ${new Date(now).toISOString()}`);
          }
        } else {
          this.log(
            `❌ REQUEST FAILED: ${request.method()} ${request.url()} - ${request.failure()?.errorText} (${duration}ms)`,
          );
        }
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
      console.error("Failed to write network log:", error);
    }

    // Plus de logs en temps réel dans la console - seulement dans le fichier
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
    const successRate =
      stats.totalRequests > 0
        ? (((stats.totalRequests - stats.failedRequests) / stats.totalRequests) * 100).toFixed(2)
        : "0.00";

    return `=== NETWORK CONNECTIVITY REPORT ===
Duration: ${(stats.duration / 1000).toFixed(2)} seconds
Total Requests: ${stats.totalRequests}
Successful Requests: ${stats.totalRequests - stats.failedRequests}
Failed Requests: ${stats.failedRequests}
Success Rate: ${successRate}%

=== CONNECTION ISSUES ===
Connection Errors (4xx/5xx): ${stats.connectionErrors}
Timeouts (>30s): ${stats.timeouts}
Total Connection Downtime: ${this.formatDuration(stats.connectionDowntime)}

=== PERFORMANCE METRICS ===
Total Data Transferred: ${this.formatBytes(stats.totalBytes)}
Average Response Time: ${stats.averageResponseTime.toFixed(2)} ms
Average Throughput: ${stats.throughputMbps.toFixed(2)} Mbps

${stats.connectionDowntime > 0 ? `⚠️  CONNECTION INTERRUPTIONS DETECTED - Total downtime: ${this.formatDuration(stats.connectionDowntime)}` : "✅ NO CONNECTION INTERRUPTIONS DETECTED"}
=====================================

==================================`;
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
