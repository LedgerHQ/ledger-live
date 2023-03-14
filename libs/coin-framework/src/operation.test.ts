import Prando from "prando";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById, getTokenById } from "./currencies";
import { isAddressPoisoningOperation } from "./operation";
import { genTokenAccount, genAccount, genOperation } from "./mocks/account";

const ethereum = getCryptoCurrencyById("ethereum");
const usdc = getTokenById("ethereum/erc20/usd__coin");
const cardano = getCryptoCurrencyById("cardano");
const lobster = getTokenById(
  "cardano/native/8654e8b350e298c80d2451beb5ed80fc9eee9f38ce6b039fb8706bc34c4f4253544552"
);

describe("Operation.ts", () => {
  describe("isPoisoningAddressOperation", () => {
    it("should detect a token operation with 0 amount with the correct currency", () => {
      const account = genAccount("myAccount", { currency: ethereum });
      const tokenAccount = genTokenAccount(0, account, usdc);
      const operation = {
        ...genOperation(
          account,
          tokenAccount,
          account.operations,
          new Prando("")
        ),
        value: new BigNumber(0),
      };

      expect(isAddressPoisoningOperation(operation, tokenAccount)).toBe(true);
    });

    it("shouldn't detect a token operation with 0 amount with the wrong currency", () => {
      const account = genAccount("myAccount", { currency: cardano });
      const tokenAccount = genTokenAccount(0, account, lobster);
      const operation = {
        ...genOperation(
          account,
          tokenAccount,
          account.operations,
          new Prando("")
        ),
        value: new BigNumber(0),
      };

      expect(isAddressPoisoningOperation(operation, tokenAccount)).toBe(false);
    });

    it("shouldn't detect a token operation with more than 0 amount with the correct currency", () => {
      const account = genAccount("myAccount", { currency: ethereum });
      const tokenAccount = genTokenAccount(0, account, usdc);
      const operation = {
        ...genOperation(
          account,
          tokenAccount,
          account.operations,
          new Prando("")
        ),
        value: new BigNumber(1),
      };

      expect(isAddressPoisoningOperation(operation, tokenAccount)).toBe(false);
    });

    it("shouldn't detect a token operation with more than 0 amount with the wrong currency", () => {
      const account = genAccount("myAccount", { currency: cardano });
      const tokenAccount = genTokenAccount(0, account, lobster);
      const operation = {
        ...genOperation(
          account,
          tokenAccount,
          account.operations,
          new Prando("")
        ),
        value: new BigNumber(1),
      };

      expect(isAddressPoisoningOperation(operation, tokenAccount)).toBe(false);
    });

    it("shouldn't break if the account provided isn't a tokenAccount", () => {
      const account = genAccount("myAccount", { currency: ethereum });
      const tokenAccount = genTokenAccount(0, account, lobster);
      const operation = {
        ...genOperation(
          account,
          tokenAccount,
          account.operations,
          new Prando("")
        ),
        value: new BigNumber(1),
      };

      expect(isAddressPoisoningOperation(operation, account)).toBe(false);
    });
  });
});
