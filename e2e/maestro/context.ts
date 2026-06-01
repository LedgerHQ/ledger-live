import { MaestroProject } from "./config/projects";
import { SWAP_LIVE_APP_MANIFEST_ID } from "./config/swap";
import { MaestroRuntime } from "./runtime/maestro";
import { MaestroApp } from "./pages/app";
import { PortfolioPage } from "./pages/portfolio";
import { ModularDrawerPage } from "./pages/modularDrawer";
import { SwapPage } from "./pages/swap";
import { SwapLiveAppPage } from "./pages/swapLiveApp";
import { E2EBridge } from "./runtime/bridge";
import { WebViewHelper } from "./runtime/webView";
import { SpeculosDeviceManager } from "./devices/speculos";

export class MaestroContext {
  readonly app: MaestroApp;
  readonly portfolio: PortfolioPage;
  readonly modularDrawer: ModularDrawerPage;
  readonly swap: SwapPage;
  readonly swapLiveApp: SwapLiveAppPage;
  readonly bridge: E2EBridge;
  readonly speculos: SpeculosDeviceManager;

  private liveAppReady = false;

  constructor(project: MaestroProject) {
    const maestro = new MaestroRuntime(project);
    this.bridge = new E2EBridge();
    this.app = new MaestroApp(project, maestro, this.bridge);
    this.portfolio = new PortfolioPage(this.app);
    this.modularDrawer = new ModularDrawerPage(this.app);
    this.swap = new SwapPage(this.app);
    this.swapLiveApp = new SwapLiveAppPage(new WebViewHelper(SWAP_LIVE_APP_MANIFEST_ID));
    this.speculos = new SpeculosDeviceManager(project);
  }

  async switchToLiveApp(): Promise<void> {
    if (this.liveAppReady) return;
    await this.swap.expectWalletApiWebview();
    this.liveAppReady = true;
  }
}
