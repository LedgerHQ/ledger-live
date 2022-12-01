import BigNumber from "bignumber.js";
import { decode } from "rlp";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import createTransaction from "../createTransaction";
import { fromAccountRaw } from "../../../account";
import { ethereum1 } from "../datasets/ethereum1";
import { signOperation } from "../signOperation";

const signTransaction = jest.fn(() =>
  Promise.resolve({
    r: "r",
    s: "s",
    v: 28,
  })
);

jest.mock("@ledgerhq/hw-app-eth", () => {
  return {
    ...jest.requireActual("@ledgerhq/hw-app-eth"),
    default: class {
      signTransaction = signTransaction;
      setLoadConfig = () => {};
    },
  };
});

jest.mock("../../../hw/deviceAccess", () => ({
  withDevice: () => (job) => job({ decorateAppAPIMethods: () => {} }),
}));

const dummyAccount = fromAccountRaw(ethereum1);
const currencies = [
  getCryptoCurrencyById("ethereum"),
  getCryptoCurrencyById("polygon"),
  getCryptoCurrencyById("bsc"),
  getCryptoCurrencyById("avalanche_c_chain"),
];

const decodeSomething = (rawTx: Buffer) => {
  const VALID_TYPES = [1, 2];
  const txType = VALID_TYPES.includes(rawTx[0]) ? rawTx[0] : null;
  const rlpData = txType === null ? rawTx : rawTx.slice(1);
  const rlpTx = decode(rlpData).map((buff: string) => {
    return Buffer.from(buff, "hex");
  });

  return rlpTx;
};

describe("signOperation", () => {
  describe("chainId encoding (EIP155)", () => {
    describe("Transaction type 0", () => {
      it("should use EIP155 for ethereum transaction", async () => {
        await signOperation({
          account: {
            ...dummyAccount,
            currency: currencies[0],
          },
          deviceId: "",
          transaction: {
            ...createTransaction(),
            recipient: "0xc3f95102D5c8F2c83e49Ce3Acfb905eDfb7f37dE",
            gasPrice: new BigNumber(0),
            nonce: 0,
          },
        })
          .toPromise()
          .catch(() => {});

        const txHashProvidedToAppBindings = (
          signTransaction.mock.calls[0] as string[]
        )[1];
        console.log(decode(txHashProvidedToAppBindings));
        expect(signTransaction).toBeCalledWith("44'/60'/0'/0/0");
      });
    });
  });
});
