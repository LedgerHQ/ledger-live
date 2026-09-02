import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { buildContactAddressPickerGroups } from "../model/buildContactAddressPickerGroups";

describe("buildContactAddressPickerGroups", () => {
  it("returns no groups without addresses", () => {
    expect(buildContactAddressPickerGroups(mockContact({ addresses: [] }))).toEqual([]);
  });

  it("groups addresses by network and truncates the displayed address", () => {
    const ethAddress = mockContactAddress({
      id: "address-eth",
      currencyId: "ethereum",
      label: "Ethereum",
      address: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
    });
    const usdtAddress = mockContactAddress({
      id: "address-usdt",
      currencyId: "base/erc20/tether_usd",
      label: "USDT",
    });
    const contact = mockContact({ addresses: [ethAddress, usdtAddress] });

    const [base, ethereum] = buildContactAddressPickerGroups(contact);

    expect(ethereum.networkId).toBe("ethereum");
    expect(ethereum.rows).toEqual([
      {
        addressId: "address-eth",
        label: "Ethereum",
        address: "0x1ad23b...46c53034",
        icon: { ledgerId: "ethereum", ticker: "ETH", network: undefined },
        contactAddress: ethAddress,
      },
    ]);

    expect(base.networkId).toBe("base");
    expect(base.rows[0].icon.network).toBe("base");
  });
});
