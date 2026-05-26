import { MaestroProject } from "./config/projects";
import { MaestroRuntime } from "./runtime/maestro";
import { MaestroApp } from "./pages/app";
import { PortfolioPage } from "./pages/portfolio";
import { ModularDrawerPage } from "./pages/modularDrawer";
import { E2EBridge } from "./runtime/bridge";
import { SpeculosDeviceManager } from "./devices/speculos";

export class MaestroContext {
  readonly maestro: MaestroRuntime;
  readonly app: MaestroApp;
  readonly portfolio: PortfolioPage;
  readonly modularDrawer: ModularDrawerPage;
  readonly bridge: E2EBridge;
  readonly speculos: SpeculosDeviceManager;

  constructor(readonly project: MaestroProject) {
    this.maestro = new MaestroRuntime(project);
    this.app = new MaestroApp(project, this.maestro);
    this.portfolio = new PortfolioPage(this.app);
    this.modularDrawer = new ModularDrawerPage(this.app);
    this.bridge = new E2EBridge();
    this.speculos = new SpeculosDeviceManager(project);
  }
}
