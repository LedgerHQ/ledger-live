import "../../__tests__/test-helpers/setup";

import { prepareMessageToSign } from "./hw-signMessage";
import createFixtureCryptoCurrency from "../../mock/fixtures/cryptoCurrencies";

describe("prepareMessageToSign", () => {
  it("returns a MessageData object when message to sign is a simple string", () => {
    // Given
    const currency = createFixtureCryptoCurrency("bitcoin");
    const path = "44'/60'/0'/0/0";
    const derivationMode = "";
    const message = "4d6573736167652064652074657374";
    const expectedRawMessage = "0x4d6573736167652064652074657374";

    // When
    const result = prepareMessageToSign(
      currency,
      path,
      derivationMode,
      message
    );

    // Then
    expect(result).toEqual({
      currency,
      path: "44'/60'/0'/0/0",
      derivationMode: "",
      message: "Message de test",
      rawMessage: expectedRawMessage,
    });
  });
});
