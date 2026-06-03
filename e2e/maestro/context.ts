import { MaestroProject } from "./config/projects";
import { MaestroRuntime } from "./runtime/maestro";
import { FlowBuilder } from "./runtime/flowBuilder";
import { MaestroApp } from "./pages/app";
import { PortfolioPage } from "./pages/portfolio";
import { ModularDrawerPage } from "./pages/modularDrawer";
import { SwapPage } from "./pages/swap";
import { SwapLiveApp } from "./pages/swapLiveApp";
import { E2EBridge } from "./runtime/bridge";
import { SpeculosDeviceManager } from "./devices/speculos";

export class MaestroContext {
  readonly app: MaestroApp;
  readonly portfolio: PortfolioPage;
  readonly modularDrawer: ModularDrawerPage;
  readonly swap: SwapPage;
  readonly swapLiveApp: SwapLiveApp;
  readonly bridge: E2EBridge;
  readonly speculos: SpeculosDeviceManager;
  // Shared buffer every page object writes into; serialized + run once per spec.
  readonly flow: FlowBuilder;

  private readonly maestro: MaestroRuntime;
  private liveAppReady = false;

  constructor(project: MaestroProject) {
    this.flow = new FlowBuilder();
    this.maestro = new MaestroRuntime(project);
    this.bridge = new E2EBridge();
    this.app = new MaestroApp(project, this.maestro, this.flow);
    this.portfolio = new PortfolioPage(this.app);
    this.modularDrawer = new ModularDrawerPage(this.app);
    this.swap = new SwapPage(this.app);
    this.swapLiveApp = new SwapLiveApp(this.flow);
    this.speculos = new SpeculosDeviceManager(project);
  }

  async switchToLiveApp(): Promise<void> {
    if (this.liveAppReady) return;
    this.liveAppReady = true;
    await this.swapLiveApp.waitReady();
  }

  async runFlow(name: string): Promise<void> {
    const commands = this.flow.drain();
    if (commands.length === 0) return;
    await this.maestro.runFlow(name, commands, {}, { webViewHierarchy: true });
  }
}
