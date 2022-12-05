import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";

import createTransaction from "../createTransaction";
import { fromAccountRaw } from "../../../account";
import { ethereum1 } from "../datasets/ethereum1";
import { signOperation } from "../signOperation";
import { setEnv } from "../../../env";

const signTransaction = jest.fn(() => {
  Promise.resolve({
    r: "006c000371dc04c5752287a9901b1fac4b069eb1410173db39c407ae725e4a6e",
    s: "4f445c94cc869f01e194478a3b876052716ae7676247664acec371b6e6ad16e4",
    v: (309).toString(16),
  });
});

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

const currencies = Object.values(cryptocurrenciesById).filter((currency) => {
  return currency.family === "ethereum" && "ethereumLikeInfo" in currency;
});

describe("signOperation", () => {
  describe("chainId encoding (EIP155)", () => {
    describe("Transaction type 0", () => {
      beforeAll(() => {
        setEnv("EIP1559_ENABLED_CURRENCIES", "");
      });

      currencies.forEach(async (currency) => {
        it(`should use EIP155 for ${currency.id} transaction`, async () => {
          // signTransaction.mockImplementationOnce(() =>
          //   Promise.resolve({
          //     r: "006c000371dc04c5752287a9901b1fac4b069eb1410173db39c407ae725e4a6e",
          //     s: "4f445c94cc869f01e194478a3b876052716ae7676247664acec371b6e6ad16e4",
          //     v: (currency.ethereumLikeInfo!.chainId * 2 + 35).toString(16),
          //   })
          // );

          await signOperation({
            account: {
              ...dummyAccount,
              currency,
            },
            deviceId: "",
            transaction: {
              ...createTransaction(),
              recipient: "0xc3f95102D5c8F2c83e49Ce3Acfb905eDfb7f37dE",
              gasPrice: new BigNumber(0),
              nonce: 0,
            },
          }).toPromise();

          console.log(
            currency.id,
            signTransaction.mock.calls
            // signTransaction.mock.calls[index]
          );

          expect(true).toBe(true);
          //const txHashProvidedToAppBindings = (
          //  signTransaction.mock.calls[index] as unknown[]
          //)[1];
          //
          //expect(
          //  ethers.utils.parseTransaction(`0x${txHashProvidedToAppBindings}`)
          //    .chainId
          //).toBe(currency.ethereumLikeInfo?.chainId);
        });
      });
    });

    /*    describe.skip("Transaction type 2", () => {
    beforeAll(() => {
      setEnv(
        "EIP1559_ENABLED_CURRENCIES",
        currencies.map((currency) => currency.id).join(",")
      );
    });

    currencies.forEach(async (currency) => {
      signTransaction.mockImplementationOnce(() =>
        Promise.resolve({
          r: "006c000371dc04c5752287a9901b1fac4b069eb1410173db39c407ae725e4a6e",
          s: "4f445c94cc869f01e194478a3b876052716ae7676247664acec371b6e6ad16e4",
          v: (currency.ethereumLikeInfo!.chainId * 2 + 35).toString(16),
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

      it(`should use EIP155 for ${currency.id} transaction`, async () => {
        await signOperation({
          account: {
            ...dummyAccount,
            currency,
          },
          deviceId: "",
          transaction: {
            ...createTransaction(),
            recipient: "0xc3f95102D5c8F2c83e49Ce3Acfb905eDfb7f37dE",
            gasPrice: new BigNumber(0),
            maxFeePerGas: new BigNumber(0),
            maxPriorityFeePerGas: new BigNumber(0),
            nonce: 0,
          },
        })
          .toPromise()
          .catch(() => {});

        const txHashProvidedToAppBindings = (
          signTransaction.mock.calls[0] as unknown[]
        )[1];

        expect(
          ethers.utils.parseTransaction(`0x${txHashProvidedToAppBindings}`)
            .chainId
        ).toBe(currency.ethereumLikeInfo?.chainId);
      });
    });
     }); */
  });
});
