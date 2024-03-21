import React, { useState, useEffect } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import styled from "styled-components";
import {
  completeAuthenticate,
  initializeClient,
  biconomy,
  zerodev,
  signer,
} from "@ledgerhq/account-abstraction";
import EmptyStateAccounts from "../dashboard/EmptyStateAccounts";
import { buildAccount } from "~/renderer/modals/SmartAccountSignerModal/accountStructure";
import { useDispatch } from "react-redux";
import { addAccount } from "~/renderer/actions/accounts";
import LabelWithExternalIcon from "~/renderer/components/LabelWithExternalIcon";
import { setDrawer } from "~/renderer/drawers/Provider";
import { openURL } from "~/renderer/linking";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
// import { cryptocurrenciesById } from "@ledgerhq/cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { createWalletClient, http } from "viem";
import {
  signMessage,
  signTransaction,
  signTypedData,
  privateKeyToAddress,
  toAccount,
} from "viem/accounts";
import { sepolia } from "viem/chains";
import { openModal } from "~/renderer/actions/modals";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { prepareMessageToSign } from "@ledgerhq/live-common/hw/signMessage/index";

const Container = styled(Flex).attrs({
  flex: "1",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  overflow: "hidden",
  px: 1,
  mx: -1,
})``;

const Title = styled(Text).attrs({ variant: "h3" })`
  font-size: 28px;
  line-height: 33px;
`;

async function completeAuth(orgId: string, bundle: string) {
  try {
    const { email, address } = await completeAuthenticate(orgId, bundle);
    console.log(`[completeAuthenticate] finsihed, mail = ${email} and address = ${address}`);
    return { email, address };
  } catch (err) {
    console.error(err);
  }
}

export default function AccountAbstraction({ location: { state } }) {
  const dispatch = useDispatch();
  console.log({ signerFetched: state?.signer });
  const signerFromQueryParams = state?.signer;
  const [address, setAddress] = useState("");
  const [saAddress, setSaAddress] = useState("");
  const [multisigSaAddress, setMultisigSaAddress] = useState("");
  // const [smartAccount, setSmartAccount] = useState({});
  const [mintTransactionHash, setMintTransactionHash] = useState("");
  const [userOpReceipt, setUserOpReceipt] = useState({});
  const [loggedEmail, setLoggedEmail] = useState("");
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const check = async () => {
      if (!!signerFromQueryParams && signerFromQueryParams.orgId && signerFromQueryParams.bundle) {
        console.log(`will complete authentication for ${signerFromQueryParams.orgId}`);
        const res = await completeAuth(signerFromQueryParams.orgId, signerFromQueryParams.bundle);
        console.log({ RESHERE: res });
        setAddress(res.address);
        setLoggedEmail(res.email || "");
        // await initializeClient();
        await handleConnect(res.email || "");
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-expect-error
        dispatch(addAccount(account));
      } else {
        const user = await signer.getAuthDetails().catch(() => null);
        if (user) {
          console.log("found a user in local storage, initializing client!");
          console.log({ user });
          setAddress(user.address);
          setLoggedEmail(user.email || "");
          // await initializeClient();
          await handleConnect(user.email || "");
        }
      }
    };
    check();
  }, [signerFromQueryParams]);

  const handleConnect = async (email: string) => {
    // const res = await biconomy.connect();
    const res = await zerodev.connect();
    console.log({ email, res });
    if (res && !!res.saAddress) {
      console.log({ res });
      setSaAddress(res.saAddress);
      // setSmartAccount(res.smartAccount);
      const account = await buildAccount(res.saAddress, email);
      console.log({ accountbuilt: account });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      dispatch(addAccount(account));
    }
  };

  const handleMint = async () => {
    const res = await zerodev.safeMint({ chainId: "11155111", saAddress });
    console.log({ resmint: res });
    if (res && !!res.transactionHash) {
      setMintTransactionHash(res.transactionHash);
      // setUserOpReceipt(res.userOpReceipt);
    }
  };

  const handleMintMultisig = async () => {
    const res = await zerodev.safeMint({ chainId: "11155111", saAddress: multisigSaAddress });
    console.log({ resmintmultisig: res });
    if (res && !!res.transactionHash) {
      setMintTransactionHash(res.transactionHash);
      // setUserOpReceipt(res.userOpReceipt);
    }
  };

  const pickAccount = async () => {
    // const defaultEthCryptoFamily = cryptocurrenciesById["ethereum"];
    // console.log({ defaultEthCryptoFamily });
    const eth = getCryptoCurrencyById("ethereum");
    const sepolia = getCryptoCurrencyById("ethereum_sepolia");
    console.log({ eth, sepolia });

    setDrawer(
      SelectAccountAndCurrencyDrawer,
      {
        currencies: [eth, sepolia],
        onAccountSelected: (account: AccountLike, parentAccount: Account | undefined) => {
          setDrawer();
          console.log({ account, parentAccount });
          setAccount(account);
        },
        // accounts$,
      },
      {
        onRequestClose: () => {
          setDrawer();
        },
      },
    );
  };

  const setupCustomSigner = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const viemAccount = toAccount({
      address: account.freshAddress, //"0xc92540682568eA75C6Ff9308BA30194e8aB6330e", // getAddress(privateKey),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      async signMessage({ message }) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        console.log("SIGNING");
        debugger;
        const res = openModal("MODAL_SIGN_MESSAGE", {
          account,
          message,
          onConfirmationHandler: () => {},
          onFailHandler: () => {},
          onClose: () => {},
        });
        console.log({ res });
        return res;
        // return signMessage({ message, privateKey });
      },

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      async signTransaction(transaction, { serializer }) {
        // return signTransaction({ privateKey, transaction, serializer });
        console.log("IN SIGNTRANSACTION");
        debugger;
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
        // return signTransaction({ privateKey, transaction, serializer });
        // console.log({ serializer });
        console.log("IN SIGNTYPEDDATA");
        debugger;
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

  const handleAddLedgerSigner = async () => {
    const ledgerSigner = setupCustomSigner();
    console.log({ ledgerSigner });
    const res = await zerodev.addLedgerSigner({
      chainId: "11155111",
      saAddress,
      ledgerSigner,
    });
    console.log({ resAddLedgerSigner: res });
    if (res && res.newSaAddress) {
      setMultisigSaAddress(res.newSaAddress);
    }
  };

  //   const { requestParams } = useMarketData();
  return (
    <Container>
      {address ? (
        <Container>
          <Title>Smart Account</Title>
          <Box marginY={30} flow={5}>
            <Box horizontal alignItems="center" justifyContent="space-between">
              <Text variant="h3Inter" fontWeight="semiBold">
                Connected with {loggedEmail}
              </Text>
            </Box>
          </Box>
          <Text color="palette.text.shade80" ff="Inter|SemiBold" fontSize={4}>
            Address of signer:
            <LabelWithExternalIcon
              color="wallet"
              ff="Inter|SemiBold"
              onClick={() => {
                openURL(`https://sepolia.etherscan.io/address/${address}`);
              }}
              label={address}
            />
          </Text>
          <Text color="palette.text.shade80" ff="Inter|SemiBold" fontSize={4}>
            Smart Account address:
            <LabelWithExternalIcon
              color="wallet"
              ff="Inter|SemiBold"
              onClick={() => {
                openURL(`https://sepolia.etherscan.io/address/${saAddress}`);
              }}
              label={saAddress}
            />
          </Text>
          <Text color="palette.text.shade80" ff="Inter|SemiBold" fontSize={4}>
            Multisig Smart Account address:
            <LabelWithExternalIcon
              color="wallet"
              ff="Inter|SemiBold"
              onClick={() => {
                openURL(`https://sepolia.etherscan.io/address/${multisigSaAddress}`);
              }}
              label={multisigSaAddress}
            />
          </Text>
          [biconomy] mint transactionHash = {mintTransactionHash}
          <hr />
          [biconomy] mint userOpReceipt = {JSON.stringify(userOpReceipt)}
          <hr />
          <Box width={100}>
            <Button primary mr={2} onClick={handleMint}>
              <Box horizontal flow={1} alignItems="center">
                <Box>Mint</Box>
              </Box>
            </Button>
          </Box>
          <Box width={200}>
            <Button primary mr={2} onClick={handleMintMultisig}>
              <Box horizontal flow={1} alignItems="center">
                <Box>Mint with multisig</Box>
              </Box>
            </Button>
          </Box>
          <Box width={500}>
            <Button onClick={pickAccount}>Pick an account to add as a signer</Button>
            <Button primary mr={2} onClick={handleAddLedgerSigner}>
              <Box horizontal flow={1} alignItems="center">
                <Box>Increase security, add a ledger as a signer</Box>
              </Box>
            </Button>
          </Box>
          <hr />
        </Container>
      ) : (
        <EmptyStateAccounts />
      )}
    </Container>
  );
}
