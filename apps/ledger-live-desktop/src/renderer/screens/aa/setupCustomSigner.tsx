import { toAccount } from "viem/accounts";
import { openModal } from "~/renderer/actions/modals";
import { prepareMessageToSign } from "@ledgerhq/live-common/hw/signMessage/index";
import { AccountLike } from "@ledgerhq/types-live";
import { Dispatch } from "react";

export const setupCustomSigner = ({
  account,
  dispatch,
}: {
  account: AccountLike;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  dispatch: Dispatch<Any>;
}) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  console.log({ account, address: account.freshAddress });
  const viemAccount = toAccount({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    address: account.freshAddress, //"0xc92540682568eA75C6Ff9308BA30194e8aB6330e", // getAddress(privateKey),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    async signMessage({ message }) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      console.log("SIGNING");
      const res = openModal("MODAL_SIGN_MESSAGE", {
        account,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        message,
        onConfirmationHandler: () => {},
        onFailHandler: () => {},
        onClose: () => {},
      });
      console.log({ res });
      return res;
    },

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    async signTransaction(transaction, { serializer }) {
      console.log("IN SIGNTRANSACTION");
      console.log({ serializer });
      const canEditFees = false;
      const res = openModal("MODAL_SIGN_TRANSACTION", {
        canEditFees,
        // stepId: canEditFees && !hasFeesProvided ? "amount" : "summary",
        stepId: "summary",
        transactionData: transaction, // NOTE: check this one also
        // useApp: options?.hwAppId,
        account,
        parentAccount: account, // NOTE: check this one
        onResult: () => {},
        onCancel: () => {},
      });
      console.log({ resigntransaction: res });
      return res;
    },

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    async signTypedData(typedData) {
      console.log("IN SIGNTYPEDDATA");
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      console.log({ accounttype: account?.type }); // NOTE: needs to be "Account", otherwise get parent
      const message = typedData.message;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const message2 = typedData.message.callDataAndNonceHash;
      const bufferedMessage = Buffer.from(message2).toString("hex");
      const formattedMessage = prepareMessageToSign(
        account,
        // account.type === "Account" ? currentAccount : currentParentAccount,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        bufferedMessage,
        // Buffer.from(message2).toString("hex"),
      );
      console.log({ formattedMessage });
      // const canEditFees = false;
      const res = await new Promise<string>((resolve, reject) => {
        dispatch(
          openModal("MODAL_SIGN_MESSAGE", {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            account,
            message: formattedMessage,
            // onSuccess: resolve,
            onConfirmationHandler: resolve,
            onFailHandler: (fail: string) => {
              console.log(`failed with ${fail}`);
              reject(fail);
            },
            onClose: () => {},
          }),
          // openModal("MODAL_SIGN_TRANSACTION", {
          //   canEditFees,
          //   // stepId: canEditFees && !hasFeesProvided ? "amount" : "summary",
          //   stepId: "summary",
          //   transactionData: typedData, // NOTE: check this one also
          //   // useApp: options?.hwAppId,
          //   account,
          //   parentAccount: account, // NOTE: check this one
          //   onResult: () => {},
          //   onCancel: () => {},
          // }),
        );
      });
      // const res = ;
      console.log({ resSignTypedData: res });
      return res;
    },
  });
  return viemAccount;
};
