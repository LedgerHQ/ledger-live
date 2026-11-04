import { Step } from "jest-allure2-reporter/api";
import { byId, byIdAndText, byTextWithAncestorId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";
import type { ContactAddressTestData } from "@ledgerhq/live-e2e-shared/contacts";
import ContactNameDrawer from "@e2e/page/drawer/contactName.drawer";

// i18n contacts.addAddressEntry.validAddress. Lumen renders the helper text without a testID.
const VALID_ADDRESS_HELPER_TEXT = "Valid address";

// Mirrors truncateContactAddress in features/flow/contacts.
const TRUNCATED_ADDRESS_VISIBLE_LENGTH = 8 + 3 + 8;

export default class ContactDetailPage {
  renameDrawer = new ContactNameDrawer();

  private readonly addressValueRegExp = /^contacts-detail-address-.+-value$/;

  private readonly screen = byId("contacts-detail-screen");
  private readonly addressCount = byId("contacts-detail-address-count");
  private readonly emptyState = byId("contacts-detail-empty-state");
  private readonly addAddressButton = byId("contacts-detail-add-address");
  private readonly addAddressInput = byId("contacts-add-address-input");
  private readonly validAddressHelperText = byTextWithAncestorId(
    "contacts-add-address-entry-screen",
    VALID_ADDRESS_HELPER_TEXT,
  );
  private readonly addAddressEnsDisclaimer = byId("contacts-add-address-ens-disclaimer");
  private readonly addAddressConfirmButton = byId("contacts-add-address-confirm");
  private readonly addAddressNameInput = byId("contacts-add-address-name-input");
  private readonly addAddressNameContinueButton = byId("contacts-add-address-name-continue");
  private readonly registerAddressDeviceConfirmation = byId(
    "contacts-register-external-address-continue-on-device",
  );
  private readonly addressDetailDialog = byId("contacts-address-detail-dialog");
  private readonly deleteAddressAction = byId("contacts-address-detail-delete");
  private readonly deleteAddressContent = byId("contacts-delete-address-content");
  private readonly deleteAddressConfirmButton = byId("contacts-delete-address-confirm");
  private readonly actionsTrigger = byId("contacts-detail-actions-trigger");
  private readonly actionsMenuContent = byId("contacts-detail-actions-menu");
  private readonly editAction = byId("contacts-detail-edit-action");
  private readonly deleteAction = byId("contacts-detail-delete-action");
  private readonly deleteContent = byId("contacts-delete-contact-content");
  private readonly deleteConfirmButton = byId("contacts-delete-contact-confirm");
  private readonly renameDevicePending = byId("contacts-rename-contact-pending");
  private readonly renameDeviceContinue = byId("contacts-rename-contact-continue-on-device");
  private readonly nameWithText = (name: string) => byIdAndText("contacts-detail-name", name);
  private readonly networkGroup = (networkId: string) =>
    byId(`contacts-detail-network-group-${networkId}`);
  private readonly addressLabel = (addressId: string) =>
    byId(`contacts-detail-address-${addressId}-label`);
  private readonly addressRow = (rowId: string) => byId(rowId);
  private readonly addressValue = (address: string) =>
    byIdAndText(this.addressValueRegExp, this.truncatedAddress(address));

  private truncatedAddress(address: string) {
    return address.length <= TRUNCATED_ADDRESS_VISIBLE_LENGTH
      ? address
      : `${address.slice(0, 8)}...${address.slice(-8)}`;
  }

  // The id is assigned on save, so the row is found from the displayed value.
  private async getAddressId(address: string): Promise<string> {
    const { identifier } = await this.addressValue(address).getAttributes();

    return identifier.replace(/^contacts-detail-address-/, "").replace(/-value$/, "");
  }

  private async getAddressRowId(address: string): Promise<string> {
    return `contacts-detail-address-row-${await this.getAddressId(address)}`;
  }

  @Step("Expect contact detail screen visible")
  async expectScreenVisible() {
    await this.screen.expectVisible();
  }

  @Step("Expect the rename device sheet to be gone")
  async expectRenameDeviceSheetClosed() {
    await this.renameDevicePending.waitNotVisible();
    await this.renameDeviceContinue.waitNotVisible();
  }

  @Step("Expect contact detail name to be {{0}}")
  async expectName(name: string, timeout = TIMEOUT.medium) {
    await this.nameWithText(name).waitVisible(timeout);
  }

  @Step("Expect the contact to have no address")
  async expectNoAddresses() {
    await this.emptyState.expectVisible();
  }

  @Step("Expect contact address count to show {{0}}")
  async expectAddressCount(expectedLabel: string) {
    await this.addressCount.expectText(expectedLabel);
  }

  @Step("Open Add address")
  async openAddAddress() {
    await this.addAddressButton.tap();
    await app.modularDrawer.waitForSearchBar();
  }

  @Step("Enter address {{{0.addressInput}}} for {{0.networkName}}")
  async enterAddress(data: ContactAddressTestData) {
    // POL sits below the drawer's top assets. The search field is a single line; once the
    // sheet expands it sits under the header, and typing Enter there never lands.
    await app.modularDrawer.performSearchByTicker(data.ticker, false);
    await app.modularDrawer.selectCurrencyByTicker(data.ticker);
    await app.modularDrawer.selectNetworkIfAsked(data.networkName);
    await this.addAddressInput.waitFullyVisible();
    // The action stays above the keyboard, and a newline would land in the field.
    await this.addAddressInput.replaceTextKeepKeyboard(data.addressInput);

    await this.validAddressHelperText.waitVisible();

    if (data.isEns) {
      await this.addAddressEnsDisclaimer.expectVisible();
    }

    await this.addAddressConfirmButton.tap();
    // The name field is clipped by the iOS keyboard inset, so it never reports fully visible.
    await this.addAddressNameContinueButton.waitFullyVisible();
    await this.addAddressNameInput.expectText(data.defaultAddressLabel);

    const prefillCollidesWithExistingLabel = data.addressLabel !== data.defaultAddressLabel;
    if (prefillCollidesWithExistingLabel) {
      await this.addAddressNameInput.replaceTextKeepKeyboard(data.addressLabel);
    }
  }

  @Step("Tap address name continue button")
  async tapAddressNameContinue() {
    await this.addAddressNameContinueButton.tap();
    await this.registerAddressDeviceConfirmation.waitVisible();
  }

  @Step("Add address {{{0.addressInput}}} for {{0.networkName}}")
  async addAddress(data: ContactAddressTestData) {
    await this.openAddAddress();
    await this.enterAddress(data);
    await this.tapAddressNameContinue();
  }

  @Step("Expect {{{0}}} saved under {{1}}")
  async expectAddressSaved(address: string, networkId: string) {
    await this.networkGroup(networkId).waitVisible();
    await this.addressValue(address).waitVisible();
  }

  @Step("Expect {{{0}}} to be labelled {{1}}")
  async expectAddressLabel(address: string, expectedLabel: string) {
    const addressId = await this.getAddressId(address);

    await this.addressLabel(addressId).expectText(expectedLabel);
  }

  @Step("Delete address {{{0}}}")
  async deleteAddress(address: string) {
    const rowId = await this.getAddressRowId(address);
    await this.addressRow(rowId).tap();
    await this.addressDetailDialog.waitFullyVisible();
    await this.deleteAddressAction.tap();
    await this.deleteAddressContent.waitFullyVisible();
    await this.deleteAddressConfirmButton.tap();
    await this.addressRow(rowId).expectNotVisible();
  }

  @Step("Open the contact actions menu")
  async openActionsMenu() {
    await this.actionsTrigger.tap();
    await this.actionsMenuContent.waitFullyVisible();
  }

  @Step("Open the rename contact drawer")
  async openRenameDrawer() {
    await this.editAction.tap();
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
    await this.deleteAction.tap();
    await this.deleteContent.waitFullyVisible();
  }

  @Step("Confirm the contact deletion")
  async tapConfirmDelete() {
    await this.deleteConfirmButton.tap();
  }

  @Step("Delete the contact")
  async deleteContact() {
    await this.openActionsMenu();
    await this.openDeleteConfirmation();
    await this.tapConfirmDelete();
  }
}
