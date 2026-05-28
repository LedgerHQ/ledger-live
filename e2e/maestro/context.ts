import { MaestroProject } from "./config/projects";
import { MaestroRuntime } from "./runtime/maestro";
import { MaestroApp } from "./pages/app";
import { PortfolioPage } from "./pages/portfolio";
import { ModularDrawerPage } from "./pages/modularDrawer";
import { SwapPage } from "./pages/swap";
import { SwapLiveAppPage } from "./pages/swapLiveApp";
import {
  AppContextSwitcher,
  LiveAppHandle,
  LiveAppName,
  NativeAppHandle,
} from "./runtime/appContext";
import { E2EBridge } from "./runtime/bridge";
import { WebViewHelper } from "./runtime/webView";
import { SpeculosDeviceManager } from "./devices/speculos";

export class MaestroContext {
  readonly maestro: MaestroRuntime;
  readonly app: MaestroApp;
  readonly portfolio: PortfolioPage;
  readonly modularDrawer: ModularDrawerPage;
  readonly swap: SwapPage;
  readonly swapLiveApp: SwapLiveAppPage;
  readonly webView: WebViewHelper;
  readonly bridge: E2EBridge;
  readonly speculos: SpeculosDeviceManager;
  readonly appContext: AppContextSwitcher;

  constructor(readonly project: MaestroProject) {
    this.maestro = new MaestroRuntime(project);
    this.app = new MaestroApp(project, this.maestro);
    this.portfolio = new PortfolioPage(this.app);
    this.modularDrawer = new ModularDrawerPage(this.app);
    this.swap = new SwapPage(this.app);
    this.webView = new WebViewHelper();
    this.swapLiveApp = new SwapLiveAppPage(this.webView);
    this.bridge = new E2EBridge();
    this.speculos = new SpeculosDeviceManager(project);
    this.appContext = new AppContextSwitcher(
      this.app,
      this.modularDrawer,
      this.portfolio,
      this.swap,
    );
  }

  /** Shortcut for `appContext.switchToLiveApp(name)`. */
  switchToLiveApp(name: LiveAppName): Promise<LiveAppHandle> {
    return this.appContext.switchToLiveApp(name);
  }

  /** Shortcut for `appContext.switchToNativeApp()`. */
  switchToNativeApp(): Promise<NativeAppHandle> {
    return this.appContext.switchToNativeApp();
  }
}
