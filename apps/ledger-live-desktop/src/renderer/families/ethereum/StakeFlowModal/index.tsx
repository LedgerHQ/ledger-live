import React from "react";
import { Account } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { EthStakingModal as V2EthStakingModal } from "./v2/EthStakingModal";
import { EthStakingModal as V1EthStakingModal } from "./v1/EthStakingModal";
import { EthStakingProvidersV2 } from "~/types/featureFlags";
type Props = {
  name: string;
  account: Account;
  checkbox?: boolean;
  singleProviderRedirectMode?: boolean;
  source?: string;
};
const DelegationModal = (props: Props) => {
  const ethStakingProvidersV2 = useFeature<EthStakingProvidersV2>("ethStakingProvidersV2");

  if (ethStakingProvidersV2?.enabled) {
    return (
      <V2EthStakingModal {...props} providers={ethStakingProvidersV2.params?.providers ?? []} />
    );
  }

  return <V1EthStakingModal {...props} />;
};
export default DelegationModal;
