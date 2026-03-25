import { getAddress } from "./addresses";
import { Account } from "@ledgerhq/types-live";
import { SAMPLE_ACCOUNT_SHAPE_INFO } from "../../test/__fixtures__";

describe("getAddress", () => {
  it("should return the fresh address and derivation path from the account", () => {
    const mockAccount: Partial<Account> = {
      freshAddress: SAMPLE_ACCOUNT_SHAPE_INFO.address,
      freshAddressPath: SAMPLE_ACCOUNT_SHAPE_INFO.derivationPath,
    };

    const result = getAddress(mockAccount as Account);

    expect(result).toEqual({
      address: SAMPLE_ACCOUNT_SHAPE_INFO.address,
      derivationPath: SAMPLE_ACCOUNT_SHAPE_INFO.derivationPath,
    });
  });
});
