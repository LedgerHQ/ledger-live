import React, { useState, useEffect, useCallback } from "react";
import { Flex, IconsLegacy, Text } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/Button";
import Box, { Card } from "~/renderer/components/Box";
import styled from "styled-components";
import { completeAuthenticate, zerodev, signer } from "@ledgerhq/account-abstraction";
import EmptyStateAccounts from "../dashboard/EmptyStateAccountsAA";
import { buildAccount } from "~/renderer/modals/SmartAccountSignerModal/accountStructure";
import { useDispatch } from "react-redux";
import { addAccount } from "~/renderer/actions/accounts";
import LabelWithExternalIcon from "~/renderer/components/LabelWithExternalIcon";
import { setDrawer } from "~/renderer/drawers/Provider";
import { openURL } from "~/renderer/linking";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { toAccount } from "viem/accounts";
import { openModal } from "~/renderer/actions/modals";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { prepareMessageToSign } from "@ledgerhq/live-common/hw/signMessage/index";
import { ItemContainer } from "~/renderer/components/TopBar/shared";
import { useSelector } from "react-redux";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { getAccountCurrency, getAccountName } from "@ledgerhq/live-common/account/index";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { MintNftActionDefault } from "../account/AccountActionsDefault";

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

const ItemContent = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
}))`
  font-size: 14px;
  line-height: 20px;
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
  console.log({ signerFromQueryParams });
  const [address, setAddress] = useState("");
  const [saAddress, setSaAddress] = useState("");
  const [multisigSaAddress, setMultisigSaAddress] = useState("");
  const [mintTransactionHash, setMintTransactionHash] = useState("");
  const [loggedEmail, setLoggedEmail] = useState("");
  const [account, setAccount] = useState<AccountLike | null>(null);
  const chain = account?.currency?.id === "ethereum" ? "ethereum_sepolia" : "polygon";
  const explorer = chain === "ethereum_sepolia" ? "sepolia.etherscan.io" : "polygonscan.com";
  const explorerBis = chain === "ethereum_sepolia" ? "eth-sepolia.blockscout.com" : "polygon.blockscout.com"
  const chainId = chain === "ethereum_sepolia" ? "11155111" : "137";

  const flattenedAccounts = useSelector(flattenAccountsSelector);
  console.log({ flattenedAccounts });

  useEffect(() => {
    if (!account) {
      console.log(`setting default account`);
      setAccount(flattenedAccounts[0]);
    }
  }, [flattenedAccounts]);

  const handleConnect = useCallback(
    async (email: string) => {
      console.log({ accountInConnect: account });
      // const res = await biconomy.connect();
      const res = await zerodev.connect();
      console.log({ email, res });
      if (res && !!res.saAddress) {
        console.log({ res });
        setSaAddress(res.saAddress);
        // setSmartAccount(res.smartAccount);
        const account = await buildAccount(res.saAddress, email, chain);
        console.log({ accountbuilt: account });
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-expect-error
        dispatch(addAccount(account));
      }
    },
    [account],
  );

  useEffect(() => {
    const check = async () => {
      console.log("CHECK");
      if (!account) {
        return;
      }
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
  }, [account, signerFromQueryParams, signerFromQueryParams?.orgId, signerFromQueryParams?.bundle]);

  const handleMint = async () => {
    const res = await zerodev.safeMint({
      chainId,
      saAddress: multisigSaAddress ? multisigSaAddress : saAddress,
    });
    console.log({ resmint: res });
    if (res && !!res.transactionHash) {
      setMintTransactionHash(res.transactionHash);
    }
  };

  const mintNft = <MintNftActionDefault onClick={handleMint} />;

  const pickAccount = async () => {
    // const defaultEthCryptoFamily = cryptocurrenciesById["ethereum"];
    // console.log({ defaultEthCryptoFamily });
    const eth = getCryptoCurrencyById("ethereum");
    const polygon = getCryptoCurrencyById("polygon");

    setDrawer(
      SelectAccountAndCurrencyDrawer,
      {
        currencies: [eth, polygon],
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
      chainId,
      saAddress,
      ledgerSigner,
    });
    console.log({ resAddLedgerSigner: res });
    if (res && res.newSaAddress) {
      setMultisigSaAddress(res.newSaAddress);
      // setSmartAccount(res.smartAccount);
      const account = await buildAccount(res.newSaAddress, loggedEmail, chain);
      console.log({ accountbuilt: account });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      dispatch(addAccount(account));
    }
  };

  const onSelectAccount = async () => {};
  return (
    <Container>
      {address ? (
        <Container>
          <Title>Smart Account</Title>
          <Box marginY={30} flow={5}>
            <Box horizontal alignItems="center" justifyContent="space-between"></Box>
            {/* <ItemContainer isInteractive onClick={handleDisconnect}>
              <IconsLegacy.EyeNoneMedium size={18} />
            </ItemContainer> */}
          </Box>
          <Card p={0} py={5} grow>
            <Flex px={6} horizontal grow>
              <Text variant="h4Inter" marginTop={2} flexGrow={1} fontWeight="semiBold">
                {loggedEmail}
              </Text>
              {account && (
                <ItemContainer marginBottom={2} isInteractive onClick={pickAccount}>
                  <>
                    <CryptoCurrencyIcon circle currency={getAccountCurrency(account)} size={16} />
                    <ItemContent marginLeft={2}>{getAccountName(account)}</ItemContent>
                  </>
                </ItemContainer>
              )}
            </Flex>
            chain = {chain} explorer = {explorer} chainId = {chainId}
            <Box px={2} marginTop={5}>
              <Text color="palette.text.shade80" ff="Inter|SemiBold" fontSize={4}>
                Email signer:
                <LabelWithExternalIcon
                  color="wallet"
                  ff="Inter|SemiBold"
                  onClick={() => {
                    openURL(`https://${explorer}/address/${address}`);
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
                    openURL(`https://${explorer}/address/${saAddress}`);
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
                    openURL(`https://${explorer}/address/${multisigSaAddress}`);
                  }}
                  label={multisigSaAddress}
                />
              </Text>
              <Text color="palette.text.shade80" ff="Inter|SemiBold" fontSize={4}>
                Minted NFT tx hash:
                <LabelWithExternalIcon
                  color="wallet"
                  ff="Inter|SemiBold"
                  onClick={() => {
                    openURL(`https://${explorer}/tx/${mintTransactionHash}`);
                  }}
                  label={mintTransactionHash}
                />
              </Text>

              <Text color="palette.text.shade80" ff="Inter|SemiBold" fontSize={4}>
                Minted NFT tx hash:
                <LabelWithExternalIcon
                  color="wallet"
                  ff="Inter|SemiBold"
                  onClick={() => {
                    openURL(`https://${explorer}/tx/${mintTransactionHash}`);
                  }}
                  label={mintTransactionHash}
                />
              </Text>
              <Text color="palette.text.shade80" ff="Inter|SemiBold" fontSize={4}>
                All user ops here:
                <LabelWithExternalIcon
                  color="wallet"
                  ff="Inter|SemiBold"
                  onClick={() => {
                    openURL(
                      `https://${explorerBis}/address/${
                        multisigSaAddress ? multisigSaAddress : saAddress
                      }?tab=user_ops`,
                    );
                  }}
                  label={`Blockscout`}
                />
              </Text>
              <Flex marginTop={30} width={180}>
                {mintNft}
              </Flex>
            </Box>
          </Card>
          <Box width={500}>
            <Button primary mr={2} onClick={handleAddLedgerSigner}>
              <Box horizontal flow={1} alignItems="center">
                <Box>Increase security, add a ledger as a signer</Box>
              </Box>
            </Button>
          </Box>
        </Container>
      ) : (
        <EmptyStateAccounts />
      )}
    </Container>
  );
}
