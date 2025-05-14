export default class LedgerSyncPage {
  useLedgerButton = () => getElementById("walletsync-choose-sync-method-connect-device");

  @Step("Select Use Ledger")
  async selectUseLedger() {
    await tapByElement(this.useLedgerButton());
  }
}
