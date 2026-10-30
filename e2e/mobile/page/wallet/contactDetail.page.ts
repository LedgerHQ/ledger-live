import { waitFor } from "detox";
import { Step } from "jest-allure2-reporter/api";
import { TIMEOUT } from "@e2e/utils/timeouts";
import type { ContactAddressTestData } from "@ledgerhq/live-e2e-shared/contacts";
import ContactNameDrawer from "@e2e/page/drawer/contactName.drawer";

// i18n contacts.addAddressEntry.validAddress — no testID on the helper text.
const VALID_ADDRESS_HELPER_TEXT = "Valid address";

// Mirrors truncateContactAddress in features/flow/contacts.
const TRUNCATED_ADDRESS_VISIBLE_LENGTH = 8 + 3 + 8;

export default class ContactDetailPage {
  renameDrawer = new ContactNameDrawer();

  private readonly addressValueRegExp = /^contacts-detail-address-.+-value$/;
  private readonly addressDetailDialogId = "contacts-address-detail-dialog";
  private readonly deleteAddressContentId = "contacts-delete-address-content";
  private readonly actionsMenuContentId = "contacts-detail-actions-menu";
  private readonly deleteContentId = "contacts-delete-contact-content";
  private readonly addAddressInputId = "contacts-add-address-input";

  private readonly screen = () => getElementById("contacts-detail-screen");
  private readonly name = () => getElementById("contacts-detail-name");
  private readonly addressCount = () => getElementById("contacts-detail-address-count");
  private readonly emptyState = () => getElementById("contacts-detail-empty-state");
  private readonly addAddressButton = () => getElementById("contacts-detail-add-address");
  private readonly addAddressInput = () => getElementById(this.addAddressInputId);
  private readonly addAddressEnsDisclaimer = () =>
    getElementById("contacts-add-address-ens-disclaimer");
  private readonly addAddressConfirmButton = () => getElementById("contacts-add-address-confirm");
  private readonly addAddressNameInputId = "contacts-add-address-name-input";
  private readonly addAddressNameInput = () => getElementById(this.addAddressNameInputId);
  private readonly addAddressNameContinueId = "contacts-add-address-name-continue";
  private readonly addAddressNameContinueButton = () =>
    getElementById(this.addAddressNameContinueId);
  private readonly registerAddressDeviceConfirmation = () =>
    getElementById("contacts-register-external-address-continue-on-device");
  private readonly deleteAddressAction = () => getElementById("contacts-address-detail-delete");
  private readonly deleteAddressConfirmButton = () =>
    getElementById("contacts-delete-address-confirm");
  private readonly networkGroup = (networkId: string) =>
    getElementById(`contacts-detail-network-group-${networkId}`);
  private readonly addressLabel = (addressId: string) =>
    getElementById(`contacts-detail-address-${addressId}-label`);
  private readonly addressRow = (rowId: string) => getElementById(rowId);
  private readonly actionsTrigger = () => getElementById("contacts-detail-actions-trigger");
  private readonly editAction = () => getElementById("contacts-detail-edit-action");
  private readonly deleteAction = () => getElementById("contacts-detail-delete-action");
  private readonly deleteConfirmButton = () => getElementById("contacts-delete-contact-confirm");
  private readonly renameDevicePendingId = "contacts-rename-contact-pending";
  private readonly renameDeviceContinueId = "contacts-rename-contact-continue-on-device";
  private readonly addressValue = (address: string) =>
    getElementByIdAndText(this.addressValueRegExp, this.truncatedAddress(address));

  private truncatedAddress(address: string) {
    return address.length <= TRUNCATED_ADDRESS_VISIBLE_LENGTH
      ? address
      : `${address.slice(0, 8)}...${address.slice(-8)}`;
  }

  // The id is assigned on save, so the row is found from the displayed value.
  private async getAddressId(address: string): Promise<string> {
    const valueId = await getIdOfElement(this.addressValue(address));

    return valueId.replace(/^contacts-detail-address-/, "").replace(/-value$/, "");
  }

  private async getAddressRowId(address: string): Promise<string> {
    return `contacts-detail-address-row-${await this.getAddressId(address)}`;
  }

  @Step("Expect contact detail screen visible")
  async expectScreenVisible() {
    await detoxExpect(this.screen()).toBeVisible();
  }

  @Step("Expect the rename device sheet to be gone")
  async expectRenameDeviceSheetClosed() {
    await waitFor(getElementById(this.renameDevicePendingId))
      .not.toExist()
      .withTimeout(TIMEOUT.xxlarge);
    await waitFor(getElementById(this.renameDeviceContinueId))
      .not.toExist()
      .withTimeout(TIMEOUT.xxlarge);
  }

  @Step("Expect contact detail name to be {{0}}")
  async expectName(name: string, timeout = TIMEOUT.medium) {
    await waitFor(this.name()).toHaveText(name).withTimeout(timeout);
  }

  @Step("Expect the contact to have no address")
  async expectNoAddresses() {
    await detoxExpect(this.emptyState()).toBeVisible();
  }

  @Step("Expect contact address count to show {{0}}")
  async expectAddressCount(expectedLabel: string) {
    await detoxExpect(this.addressCount()).toHaveText(expectedLabel);
  }

  @Step("Open Add address")
  async openAddAddress() {
    await tapByElement(this.addAddressButton());
    await app.modularDrawer.waitForSearchBar();
  }

  @Step("Enter address {{{0.addressInput}}} for {{0.networkName}}")
  async enterAddress(data: ContactAddressTestData) {
    // POL sits below the drawer's top assets. The search field is a single line; once the
    // sheet expands it sits under the header, and typing Enter there never lands.
    await app.modularDrawer.performSearchByTicker(data.ticker, false);
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
  }

  @Step("Tap address name continue button")
  async tapAddressNameContinue() {
    await tapByElement(this.addAddressNameContinueButton());
    await waitForElement(this.registerAddressDeviceConfirmation());
  }

  @Step("Add address {{{0.addressInput}}} for {{0.networkName}}")
  async addAddress(data: ContactAddressTestData) {
    await this.openAddAddress();
    await this.enterAddress(data);
    await this.tapAddressNameContinue();
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
