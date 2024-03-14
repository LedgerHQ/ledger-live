import React from "react";
import { useNftGallery } from "../../hooks/useNftGallery";
import { LayoutKey } from "../../types/Layouts";
import InscriptionsGrid from "./Grid";
import InscriptionsList from "./List";
import { Account } from "@ledgerhq/types-live";

type Props = {
  layout: LayoutKey;
  account: Account;
};

export function Inscriptions({ layout, account }: Props) {
  console.log("account", JSON.stringify(account, null, 2));
  const addresses = account.operations.filter(op => op.type === "IN").map(op => op.recipients[0]);
  const { nfts } = useNftGallery({
    addresses: addresses[0] || "bc1pgtat0n2kavrz4ufhngm2muzxzx6pcmvr4czp089v48u5sgvpd9vqjsuaql",
    standard: "inscriptions",
    threshold: 10,
  });

  return layout === "grid" ? (
    <InscriptionsGrid data={nfts || []} />
  ) : (
    <InscriptionsList data={nfts || []} />
  );
}
