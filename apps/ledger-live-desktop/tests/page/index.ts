import { PageHolder } from "tests/page/abstractClasses";
import { AccountPage } from "../page/account.page";
import { AccountsPage } from "../page/accounts.page";
import { PortfolioPage } from "../page/portfolio.page";
import { AddAccountModal } from "../page/modal/add.account.modal";
import { Layout } from "tests/component/layout.component";
import { Modal } from "../component/modal.component";
import { ReceiveModal } from "../page/modal/receive.modal";
import { SpeculosPage } from "tests/page/speculos.page";
import { SendModal } from "tests/page/modal/send.modal";
import { Drawer } from "tests/page/drawer/drawer";
import { SettingsPage } from "tests/page/settings.page";
import { LedgerSyncDrawer } from "./drawer/ledger.sync.drawer";
import { SwapPage } from "tests/page/swap.page";
import { SwapConfirmationDrawer } from "tests/page/drawer/swap.confirmation.drawer";

export class Application extends PageHolder {
  public account = new AccountPage(this.page);
  public drawer = new Drawer(this.page);
  public accounts = new AccountsPage(this.page);
  public portfolio = new PortfolioPage(this.page);
  public addAccount = new AddAccountModal(this.page);
  public layout = new Layout(this.page);
  public modal = new Modal(this.page);
  public receive = new ReceiveModal(this.page);
  public speculos = new SpeculosPage(this.page);
  public send = new SendModal(this.page);
  public settings = new SettingsPage(this.page);
  public ledgerSync = new LedgerSyncDrawer(this.page);
  public swap = new SwapPage(this.page);
  public swapDrawer = new SwapConfirmationDrawer(this.page);
}
