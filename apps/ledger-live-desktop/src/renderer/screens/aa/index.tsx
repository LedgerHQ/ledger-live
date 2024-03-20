import React, { useState, useEffect } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import styled from "styled-components";
import {
  completeAuthenticate,
  initializeClient,
  biconomy,
  signer,
} from "@ledgerhq/account-abstraction";
import EmptyStateAccounts from "../dashboard/EmptyStateAccounts";
import { buildAccount } from "~/renderer/modals/SmartAccountSignerModal/accountStructure";
import { useDispatch } from "react-redux";
import { addAccount } from "~/renderer/actions/accounts";
import LabelWithExternalIcon from "~/renderer/components/LabelWithExternalIcon";
import { openURL } from "~/renderer/linking";

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
  const [smartAccount, setSmartAccount] = useState({});
  const [mintTransactionHash, setMintTransactionHash] = useState("");
  const [userOpReceipt, setUserOpReceipt] = useState({});
  const [loggedEmail, setLoggedEmail] = useState("");

  useEffect(() => {
    const check = async () => {
      if (!!signerFromQueryParams && signerFromQueryParams.orgId && signerFromQueryParams.bundle) {
        console.log(`will complete authentication for ${signerFromQueryParams.orgId}`);
        const res = await completeAuth(signerFromQueryParams.orgId, signerFromQueryParams.bundle);
        console.log({ RESHERE: res });
        setAddress(res.address);
        setLoggedEmail(res.email || "");
        await initializeClient();
        await handleConnect();
        const account = await buildAccount(address, loggedEmail);
        console.log({ accountbuilt: account });
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
          await initializeClient();
          await handleConnect();
          const account = await buildAccount(user.address, user.email);
          console.log({ accountbuilt: account });
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-expect-error
          dispatch(addAccount(account));
        }
      }
    };
    check();
  }, [signerFromQueryParams]);

  const handleConnect = async () => {
    const res = await biconomy.connect();
    if (res && !!res.saAddress) {
      console.log({ res });
      setSaAddress(res.saAddress);
      setSmartAccount(res.smartAccount);
    }
  };

  const handleMint = async () => {
    const res = await biconomy.safeMint({ saAddress, smartAccount });
    if (res && !!res.transactionHash) {
      setMintTransactionHash(res.transactionHash);
      setUserOpReceipt(res.userOpReceipt);
    }
    console.log({ mintres: res });
  };
  //
  //   const { requestParams } = useMarketData();
  return (
    <Container>
      {address ? (
        <Container>
          <Title>Account Abstraction</Title>
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
        </Container>
      ) : (
        <EmptyStateAccounts />
      )}
    </Container>
  );
}
