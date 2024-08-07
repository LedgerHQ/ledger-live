import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import React from "react";
import { Switch, Route, withRouter } from "react-router";
import NftCollection from "../Nfts/Collection";
import NFTGallery from "~/renderer/screens/nft/Gallery";
import NftBreadCrumb from "LLD/components/BreadCrumb";

export const account = genAccount("ethereum1", {
  withNft: true,
  operationsSize: 30,
});

const NftCollectionNavigation = () => (
  <Switch>
    <Route exact path="/" render={() => <NftCollection account={account} />} />
    <Route path="/account/:id/nft-collection" render={() => <NFTGallery />} />
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
    <NftCollection account={genAccount("ethereum1")} />
  </>
));
