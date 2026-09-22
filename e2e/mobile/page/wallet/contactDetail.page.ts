import { Step } from "jest-allure2-reporter/api";
import type { ContactAddressTestData } from "@ledgerhq/live-e2e-shared/contacts";
import ContactNameDrawer, { RENAME_CONTACT_PREFIX } from "@e2e/page/drawer/contactName.drawer";

// i18n contacts.addAddressEntry.validAddress — no testID on the helper text.
const VALID_ADDRESS_HELPER_TEXT = "Valid address";

// Mirrors truncateContactAddress in features/flow/contacts.
const TRUNCATED_ADDRESS_VISIBLE_LENGTH = 8 + 3 + 8;

export default class ContactDetailPage {
  renameDrawer = new ContactNameDrawer(RENAME_CONTACT_PREFIX);

  addressValueRegExp = /^contacts-detail-address-.+-value$/;
  addressDetailDialogId = "contacts-address-detail-dialog";
  deleteAddressContentId = "contacts-delete-address-content";

  screen = () => getElementById("contacts-detail-screen");
  name = () => getElementById("contacts-detail-name");
  addressCount = () => getElementById("contacts-detail-address-count");
  emptyState = () => getElementById("contacts-detail-empty-state");
  addAddressButton = () => getElementById("contacts-detail-add-address");
  addAddressInputId = "contacts-add-address-input";
  addAddressInput = () => getElementById(this.addAddressInputId);
  addAddressEnsDisclaimer = () => getElementById("contacts-add-address-ens-disclaimer");
  addAddressConfirmButton = () => getElementById("contacts-add-address-confirm");
  addAddressNameInputId = "contacts-add-address-name-input";
  addAddressNameInput = () => getElementById(this.addAddressNameInputId);
  addAddressNameContinueId = "contacts-add-address-name-continue";
  addAddressNameContinueButton = () => getElementById(this.addAddressNameContinueId);
  registerAddressDeviceConfirmation = () =>
    getElementById("contacts-register-external-address-continue-on-device");
  deleteAddressAction = () => getElementById("contacts-address-detail-delete");
  deleteAddressConfirmButton = () => getElementById("contacts-delete-address-confirm");
  networkGroup = (networkId: string) =>
    getElementById(`contacts-detail-network-group-${networkId}`);
  addressLabel = (addressId: string) =>
    getElementById(`contacts-detail-address-${addressId}-label`);
  addressRow = (rowId: string) => getElementById(rowId);
  actionsTrigger = () => getElementById("contacts-detail-actions-trigger");
  editAction = () => getElementById("contacts-detail-edit-action");
  deleteAction = () => getElementById("contacts-detail-delete-action");
  actionsMenuContentId = "contacts-detail-actions-menu";
  deleteContentId = "contacts-delete-contact-content";
  deleteConfirmButton = () => getElementById("contacts-delete-contact-confirm");

  @Step("Expect contact detail screen visible")
  async expectScreenVisible() {
    await detoxExpect(this.screen()).toBeVisible();
  }

  @Step("Expect contact detail name to be {{0}}")
  async expectName(name: string) {
    await detoxExpect(this.name()).toHaveText(name);
  }

  @Step("Expect the contact to have no address")
  async expectNoAddresses() {
    await detoxExpect(this.emptyState()).toBeVisible();
  }

  @Step("Expect contact address count to show {{0}}")
  async expectAddressCount(expectedLabel: string) {
    await detoxExpect(this.addressCount()).toHaveText(expectedLabel);
  }

  // iOS counts a view flush with the sheet edge as hidden, so waits target an inset anchor.
  @Step("Open Add address")
  async openAddAddress() {
    await tapByElement(this.addAddressButton());
    await waitForFullyVisibleById(app.modularDrawer.searchBarId);
  }

  @Step("Enter address {{{0.addressInput}}} for {{0.networkName}}")
  async enterAddress(data: ContactAddressTestData) {
    // POL sits below the drawer's top assets.
    await app.modularDrawer.performSearchByTicker(data.ticker);
    await app.modularDrawer.selectCurrencyByTicker(data.ticker);
    await app.modularDrawer.selectNetworkIfAsked(data.networkName);
    await waitForFullyVisibleById(this.addAddressInputId);
    // The action stays above the keyboard, and a newline would land in the field.
    await typeTextByElement(this.addAddressInput(), data.addressInput, false);

    await waitForElementByText(VALID_ADDRESS_HELPER_TEXT);

    if (data.isEns) {
      await detoxExpect(this.addAddressEnsDisclaimer()).toBeVisible();
    }

    await tapByElement(this.addAddressConfirmButton());
    // The name field is clipped by the iOS keyboard inset, so it never reports fully visible.
    await waitForFullyVisibleById(this.addAddressNameContinueId);
    await detoxExpect(this.addAddressNameInput()).toHaveText(data.defaultAddressLabel);

    const prefillCollidesWithExistingLabel = data.addressLabel !== data.defaultAddressLabel;
    if (prefillCollidesWithExistingLabel) {
      await clearTextByElement(this.addAddressNameInput());
      await typeTextByElement(this.addAddressNameInput(), data.addressLabel, false);
    }

    await tapByElement(this.addAddressNameContinueButton());
    await waitForElement(this.registerAddressDeviceConfirmation());
  }

  @Step("Add {{0.networkName}} address {{{0.addressInput}}}")
  async addAddress(data: ContactAddressTestData) {
    await this.openAddAddress();
    await this.enterAddress(data);
  }

  private truncatedAddress(address: string) {
    return address.length <= TRUNCATED_ADDRESS_VISIBLE_LENGTH
      ? address
      : `${address.slice(0, 8)}...${address.slice(-8)}`;
  }

  private addressValue(address: string) {
    return getElementByIdAndText(this.addressValueRegExp, this.truncatedAddress(address));
  }

  // The id is assigned on save, so the row is found from the displayed value.
  private async getAddressId(address: string): Promise<string> {
    const valueId = await getIdOfElement(this.addressValue(address));

    return valueId.replace(/^contacts-detail-address-/, "").replace(/-value$/, "");
  }

  private async getAddressRowId(address: string): Promise<string> {
    return `contacts-detail-address-row-${await this.getAddressId(address)}`;
  }

  @Step("Expect {{{0}}} saved under {{1}}")
  async expectAddressSaved(address: string, networkId: string) {
    await waitForElement(this.networkGroup(networkId));
    await waitForElement(this.addressValue(address));
    await detoxExpect(this.networkGroup(networkId)).toBeVisible();
    await detoxExpect(this.addressValue(address)).toBeVisible();
  }

  @Step("Expect {{{0}}} to be labelled {{1}}")
  async expectAddressLabel(address: string, expectedLabel: string) {
    const addressId = await this.getAddressId(address);

    await detoxExpect(this.addressLabel(addressId)).toHaveText(expectedLabel);
  }

  @Step("Delete address {{{0}}}")
  async deleteAddress(address: string) {
    const rowId = await this.getAddressRowId(address);
    await tapByElement(this.addressRow(rowId));
    await waitForFullyVisibleById(this.addressDetailDialogId);
    await tapByElement(this.deleteAddressAction());
    await waitForFullyVisibleById(this.deleteAddressContentId);
    await tapByElement(this.deleteAddressConfirmButton());
    await detoxExpect(this.addressRow(rowId)).not.toExist();
  }

  @Step("Open the contact actions menu")
  async openActionsMenu() {
    await tapByElement(this.actionsTrigger());
    await waitForFullyVisibleById(this.actionsMenuContentId);
  }

  @Step("Open the rename contact drawer")
  async openRenameDrawer() {
    await tapByElement(this.editAction());
    await this.renameDrawer.expectVisible();
  }

  @Step("Rename the contact to {{0}}")
  async renameContact(name: string) {
    await this.openActionsMenu();
    await this.openRenameDrawer();
    await this.renameDrawer.typeAndConfirm(name);
  }

  @Step("Open the delete contact confirmation")
  async openDeleteConfirmation() {
    await tapByElement(this.deleteAction());
    await waitForFullyVisibleById(this.deleteContentId);
  }

  @Step("Confirm the contact deletion")
  async tapConfirmDelete() {
    await tapByElement(this.deleteConfirmButton());
  }

  @Step("Delete the contact")
  async deleteContact() {
    await this.openActionsMenu();
    await this.openDeleteConfirmation();
    await this.tapConfirmDelete();
  }
}
