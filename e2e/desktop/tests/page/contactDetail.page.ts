import { expect } from "@playwright/test";
import type { ContactAddressTestData } from "@ledgerhq/live-e2e-shared/contacts";
import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";

const TRUNCATED_ADDRESS_VISIBLE_LENGTH = 8 + 3 + 8;

export class ContactDetailPage extends AppPage {
  private readonly screen = this.page.getByTestId("contacts-detail-screen");
  private readonly expandedHeader = this.page.locator(
    "[data-testid='contacts-detail-header'][data-state='expanded']",
  );
  private readonly name = this.expandedHeader.getByTestId("contacts-detail-name");
  private readonly addressCount = this.page.getByTestId("contacts-detail-address-count");
  private readonly emptyState = this.page.getByTestId("contacts-detail-empty-state");
  private readonly addAddressButton = this.expandedHeader.getByTestId(
    "contacts-detail-add-address",
  );
  private readonly assetSearchInput = this.page.getByTestId("modular-asset-dialog-search-input");
  private readonly addAddressInput = this.page.getByTestId("contacts-add-address-input");
  private readonly addAddressNameInput = this.page.getByTestId("contacts-add-address-name-input");
  private readonly addAddressEnsDisclaimer = this.page.getByTestId(
    "contacts-add-address-ens-disclaimer",
  );
  private readonly addAddressConfirmButton = this.page.getByTestId("contacts-add-address-confirm");
  private readonly deviceIntentDialog = this.page.getByTestId("device-intent-executor-dialog");
  private readonly addressDetailDialog = this.page.getByTestId("contacts-address-detail-dialog");
  private readonly deleteAddressAction = this.page.getByTestId("contacts-address-detail-delete");
  private readonly deleteAddressDialog = this.page.getByTestId("contacts-delete-address-dialog");
  private readonly deleteAddressConfirmButton = this.page.getByTestId(
    "contacts-delete-address-confirm",
  );
  private readonly editAction = this.expandedHeader.getByTestId("contacts-detail-edit-action");
  private readonly deleteAction = this.expandedHeader.getByTestId("contacts-detail-delete-action");
  private readonly deleteDialog = this.page.getByTestId("contacts-delete-contact-dialog");
  private readonly deleteConfirmButton = this.page.getByTestId("contacts-delete-contact-confirm");

  @step("Expect contact detail screen visible")
  async expectScreenVisible() {
    await expect(this.screen).toBeVisible();
  }

  @step("Expect contact detail name to be $0")
  async expectName(name: string) {
    await expect(this.name).toHaveText(name);
  }

  @step("Expect the contact to have no address")
  async expectNoAddresses() {
    await expect(this.emptyState).toBeVisible();
  }

  @step("Expect contact address count to show $0")
  async expectAddressCount(expectedLabel: string) {
    await expect(this.addressCount).toHaveText(expectedLabel);
  }

  @step("Open Add address")
  async openAddAddress() {
    await this.addAddressButton.click();
    await expect(this.assetSearchInput).toBeVisible();
  }

  @step("Enter address $0.addressInput for $0.networkName")
  async enterAddress(data: ContactAddressTestData) {
    await expect(this.addAddressInput).toBeVisible();
    await this.addAddressInput.fill(data.addressInput);
    await expect(this.addAddressNameInput).toHaveValue(data.defaultAddressLabel);
    if (data.addressLabel !== data.defaultAddressLabel) {
      await this.addAddressNameInput.fill(data.addressLabel);
    }
    if (data.isEns) {
      await expect(this.addAddressEnsDisclaimer).toBeVisible();
    }
    await expect(this.addAddressConfirmButton).toBeEnabled();
    await this.addAddressConfirmButton.click();
    await this.expectDeviceIntentVisible();
  }

  @step("Expect the device confirmation")
  async expectDeviceIntentVisible() {
    await expect(this.deviceIntentDialog).toBeVisible();
  }

  @step("Expect the device confirmation to finish")
  async expectDeviceIntentFinished() {
    await expect(this.deviceIntentDialog).toBeHidden();
  }

  @step("Expect $0 saved under $1")
  async expectAddressSaved(address: string, networkId: string) {
    const networkGroup = this.page.getByTestId(`contacts-detail-network-group-${networkId}`);
    await expect(networkGroup).toBeVisible();
    await expect(networkGroup.getByText(this.truncatedAddress(address))).toBeVisible();
  }

  @step("Expect $0 to be labelled $1")
  async expectAddressLabel(address: string, expectedLabel: string) {
    const addressId = await this.getAddressId(address);
    await expect(this.page.getByTestId(`contacts-detail-address-${addressId}-label`)).toHaveText(
      expectedLabel,
    );
  }

  @step("Delete address $0")
  async deleteAddress(address: string) {
    const addressId = await this.getAddressId(address);
    const row = this.page.getByTestId(`contacts-detail-address-row-${addressId}`);
    await row.click();
    await expect(this.addressDetailDialog).toBeVisible();
    await this.deleteAddressAction.click();
    await expect(this.deleteAddressDialog).toBeVisible();
    await this.deleteAddressConfirmButton.click();
    await expect(row).toHaveCount(0);
  }

  private truncatedAddress(address: string) {
    return address.length <= TRUNCATED_ADDRESS_VISIBLE_LENGTH
      ? address
      : `${address.slice(0, 8)}...${address.slice(-8)}`;
  }

  private addressValue(address: string) {
    return this.page
      .getByTestId(/^contacts-detail-address-.+-value$/)
      .filter({ hasText: this.truncatedAddress(address) });
  }

  private async getAddressId(address: string) {
    const valueId = await this.addressValue(address).getAttribute("data-testid");
    if (!valueId) {
      throw new Error(`Address value not found for ${address}`);
    }

    return valueId.replace(/^contacts-detail-address-/, "").replace(/-value$/, "");
  }

  @step("Click the edit action")
  async clickEditAction() {
    await this.editAction.click();
  }

  @step("Open the delete contact confirmation")
  async openDeleteConfirmation() {
    await this.deleteAction.click();
    await expect(this.deleteDialog).toBeVisible();
  }

  @step("Confirm the contact deletion")
  async tapConfirmDelete() {
    await this.deleteConfirmButton.click();
    await expect(this.deleteDialog).toBeHidden();
  }

  @step("Delete the contact")
  async deleteContact() {
    await this.openDeleteConfirmation();
    await this.tapConfirmDelete();
  }
}
