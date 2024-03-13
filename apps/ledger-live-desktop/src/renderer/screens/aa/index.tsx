import React, { useState, useEffect } from "react";
import { Flex, Button, Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { completeAuthenticate, biconomy } from "@ledgerhq/account-abstraction";
import EmptyStateAccounts from "../dashboard/EmptyStateAccounts";
import { buildAccount } from "~/renderer/modals/SmartAccountSignerModal/accountStructure";

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

export default function AccountAbstraction({ location: { state } }) {
  console.log({ signerFetched: state?.signer });
  const signerFromQueryParams = state?.signer;
  const [address, setAddress] = useState("");
  const [saAddress, setSaAddress] = useState("");
  const [smartAccount, setSmartAccount] = useState({});
  const [mintTransactionHash, setMintTransactionHash] = useState("");
  const [userOpReceipt, setUserOpReceipt] = useState({});

  useEffect(() => {
    if (!!signerFromQueryParams && signerFromQueryParams.orgId && signerFromQueryParams.bundle) {
      completeAuthenticate(signerFromQueryParams.orgId, signerFromQueryParams.bundle).then(
        setAddress,
      );
    }
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
          <hr />
          <Button onClick={handleConnect}>connect (biconomy.connect)</Button>
          <hr />
          <Button onClick={handleMint}>mint (biconomy.safemint)</Button>
          <hr />
          [alchemy] address of signer = {address}
          <hr />
          [biconomy] saAddress = {saAddress}
          <hr />
          {saAddress && "we have now have your Smart Account address"}
          <hr />
          [biconomy] mint transactionHash = {mintTransactionHash}
          <hr />
          [biconomy] mint userOpReceipt = {JSON.stringify(userOpReceipt)}
          <hr />
          <Button
            style={{ borderRadius: "500px" }}
            variant={"main"}
            onClick={async () => {
              const account = await buildAccount(address);
              console.log({ accountbuilt: account });
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              //@ts-expect-error
              dispatch(addAccount(account));
            }}
          >
            {"Customize your account"}
          </Button>
        </Container>
      ) : (
        <EmptyStateAccounts />
      )}
    </Container>
  );
}
