import { TypedDataEncoder, Wallet, type TypedDataDomain } from "ethers";
import { getBindingTypedData, isBindingSigner, type PredictionsTypedData } from "../binding";

const wallet = new Wallet(`0x${"11".repeat(32)}`);

// Synchronous, unlike `Wallet.signTypedData`, so a test can build a signature inline.
const signedBy =
  (signer: Wallet) =>
  ({ domain, types, message }: PredictionsTypedData): string => {
    const { EIP712Domain: _domainType, ...messageTypes } = types;
    return signer.signingKey.sign(
      TypedDataEncoder.hash(domain satisfies TypedDataDomain, messageTypes, message),
    ).serialized;
  };

describe("Predictions account binding", () => {
  it("asks to confirm ownership of the account, with the delegation notice, on Polygon", () => {
    expect(getBindingTypedData(wallet.address)).toEqual({
      domain: { name: "Ledger Predictions", version: "1", chainId: 137 },
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
        ],
        ConfirmAccountOwnership: [
          { name: "action", type: "string" },
          { name: "account", type: "address" },
          { name: "notice", type: "string" },
        ],
      },
      primaryType: "ConfirmAccountOwnership",
      message: {
        action: "Confirm account ownership",
        account: wallet.address,
        notice:
          "MoonPay Trade will operate a trading wallet for this account. Every trade and withdrawal needs your signature.",
      },
    });
  });

  it("accepts a signature from the account", () => {
    const typedData = getBindingTypedData(wallet.address);

    expect(isBindingSigner(wallet.address, typedData, signedBy(wallet)(typedData))).toBe(true);
  });

  it("rejects a signature from another account", () => {
    const typedData = getBindingTypedData(wallet.address);
    const otherWallet = new Wallet(`0x${"22".repeat(32)}`);

    expect(isBindingSigner(wallet.address, typedData, signedBy(otherWallet)(typedData))).toBe(
      false,
    );
  });

  it("rejects a signature that can't be recovered", () => {
    expect(isBindingSigner(wallet.address, getBindingTypedData(wallet.address), "0x1234")).toBe(
      false,
    );
  });
});
