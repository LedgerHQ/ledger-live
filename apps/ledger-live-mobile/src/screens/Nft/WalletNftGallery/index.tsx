import React from "react";
import { Box } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { NftList } from "../../../components/Nft/NftList";
import { accountsSelector } from "../../../reducers/accounts";

const WalletNftGallery = () => {
  const accounts = useSelector(accountsSelector);
  const nfts = accounts
    .map(a => a.nfts ?? [])
    .flat()
    .slice(0, 10); // TODO: REMOVE for Release and TESTS

  return (
    <Box mx={6} my={12}>
      {!!nfts && <NftList data={nfts} />}
    </Box>
  );
};

export default WalletNftGallery;
