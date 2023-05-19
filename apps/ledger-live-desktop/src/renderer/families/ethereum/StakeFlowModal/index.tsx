import React from "react";
import { Account } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { EthStakingProviders } from "~/types/featureFlags";
import { EthStakingModal } from "./EthStakingModal";

type Props = {
  name: string;
  account: Account;
  checkbox?: boolean;
  singleProviderRedirectMode?: boolean;
  source?: string;
};
const DelegationModal = (props: Props) => {
  const ethStakingProviders = useFeature<EthStakingProviders>("ethStakingProviders");

  return (
    <EthStakingModal
      {...props}
      // in this case the remaining providers have to be of type V1.
      listProviders={ethStakingProviders?.params?.listProvider}
    />
  );
};
export default DelegationModal;
