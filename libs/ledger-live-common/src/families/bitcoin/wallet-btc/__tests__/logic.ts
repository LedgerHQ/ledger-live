import { getCryptoCurrencyById } from "../../../../currencies";
import { isValidRecipient } from "../../logic";
import { InvalidAddress } from "@ledgerhq/errors";

describe("Test isValidRecipient", () => {
  function t(address: string, currencyId: string, expectValid: boolean) {
    const currency = getCryptoCurrencyById(currencyId);
    if (expectValid) {
      return expect(isValidRecipient({ currency, recipient: address })).resolves.toBeNull();
    } else {
      return expect(isValidRecipient({ currency, recipient: address })).rejects.toBeInstanceOf(
        InvalidAddress,
      );
    }
  }
  test("Fail on non-existing currency", () =>
    t("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4", "ontology", false));
  test("Fail on mainnet addr on bitcoin_testnet", () =>
    t("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4", "bitcoin_testnet", false));
  test("Success on valid address", () =>
    t("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4", "bitcoin", true));
  test("Fail on invalid qtum address", () =>
    t("xCREYTgvdk3XzFNpdXkj35fZX4hJK2Ckpe", "qtum", false));
  test("Fail on invalid bch address", () =>
    t("qr6m7j9njldwwzlg9v7v53unlr4jkmx6eylep8ekg3", "bitcoin_cash", false));
  // TODO Enable once fixed in wallet-btc
  test.skip("Success on valid bch address", () =>
    t("qr6m7j9njldwwzlg9v7v53unlr4jkmx6eylep8ekg2", "bitcoin_cash", true));
});
