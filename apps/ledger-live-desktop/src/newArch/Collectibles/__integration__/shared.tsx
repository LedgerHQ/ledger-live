import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import React from "react";
import { Switch, Route, withRouter } from "react-router";
import NFTGallery from "~/renderer/screens/nft/Gallery";
import NftBreadCrumb from "LLD/components/BreadCrumb";
import NftCollection from "../Nfts/Collection";
import NftCollections from "../Nfts/Collections";

export const account = genAccount("mockethereum", {
  withNft: true,
  operationsSize: 30,
});

const NftCollectionNavigation = () => (
  <Switch>
    <Route exact path="/" render={() => <NftCollections account={account} />} />
    <Route path="/account/:id/nft-collection" render={() => <NFTGallery />} />
    <Route path="/account/:id/nft-collection/:collectionAddress" render={() => <NftCollection />} />
  </Switch>
);

const NftCollectionTestBase = () => (
  <>
    <NftBreadCrumb />
    <NftCollectionNavigation />
  </>
);

export const NftCollectionTest = withRouter(NftCollectionTestBase);
export const NoNftCollectionTest = withRouter(() => (
  <>
    <NftBreadCrumb />
    <NftCollections account={genAccount("mockethereum")} />
  </>
));
