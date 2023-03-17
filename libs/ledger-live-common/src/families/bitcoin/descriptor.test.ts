import invariant from "invariant";
import { getCryptoCurrencyById } from "../../currencies";
import {
  inferDescriptorFromDeviceInfo,
  inferDescriptorFromAccount,
} from "./descriptor";
import { fromAccountRaw } from "../../account";
import bitcoinDatasets from "./datasets/bitcoin";
import { setSupportedCurrencies } from "../../currencies";

setSupportedCurrencies(["bitcoin"]);
describe("inferDescriptorFromAccount", () => {
  invariant(bitcoinDatasets.accounts, "bitcoin datasets have accounts");
  // FIXME: migrate away from invariant for more type guard
  const [bitcoin1, bitcoin2] = (bitcoinDatasets.accounts as any).map((a) =>
    fromAccountRaw(a.raw)
  );
  it("should work on bitcoin account 1", () => {
    expect(inferDescriptorFromAccount(bitcoin1)).toEqual({
      external:
        "pkh([224b6226/44'/0'/0']xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn/0/*)",
      internal:
        "pkh([224b6226/44'/0'/0']xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn/1/*)",
    });
  });
  it("should work on bitcoin account 2", () => {
    expect(inferDescriptorFromAccount(bitcoin2)).toEqual({
      external:
        "wpkh([d6a9e45e/84'/0'/1']xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2/0/*)",
      internal:
        "wpkh([d6a9e45e/84'/0'/1']xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2/1/*)",
    });
  });
});
describe("inferDescriptorFromDeviceInfo", () => {
  it("should work on a first Bitcoin legacy derivation", () => {
    const descriptor = inferDescriptorFromDeviceInfo({
      derivationMode: "",
      currency: getCryptoCurrencyById("bitcoin"),
      index: 0,
      parentDerivation: {
        address: "148LHFgQkoPKHUFeVzFNmUjKT7ZwB47fTR",
        path: "44'/0'",
        publicKey:
          "041caa3a42db5bdd125b2530c47cfbe829539b5a20a5562ec839d241c67d1862f2980d26ebffee25e4f924410c3316b397f34bd572543e72c59a7569ef9032f498",
        chainCode:
          "9f819c7d45eb9eb1e9bd5fa695158cca9e493182f95068b22c8c440ae6eb0720",
      },
      accountDerivation: {
        address: "15o6uBtRzKojbxqBe4Kni66BSvXfKYT2GY",
        path: "44'/0'/0'",
        publicKey:
          "04238878d371ce61cdd04d22ccab50c542e94ffa7a27d02d6bcefaa22e4fcee6db4c2029fd4de0b595e98002c0be01fc1fbd3568671e394c97a6d52c3d4c113fb5",
        chainCode:
          "44728146118df8d18d38c2615154eaffcdd53829957f4e26863344f35653364e",
      },
    });
    expect(descriptor).toEqual({
      external:
        "pkh([224b6226/44'/0'/0']xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn/0/*)",
      internal:
        "pkh([224b6226/44'/0'/0']xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn/1/*)",
    });
  });
});
