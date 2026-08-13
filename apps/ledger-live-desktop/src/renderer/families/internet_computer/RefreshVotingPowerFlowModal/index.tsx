import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";

export type Props = {
  account: ICPAccount;
};

// Registry placeholder. `coinModalImports` is a total Record over `CoinModalKey`, so the key cannot
// be declared without a module behind it. The flow steps land in LIVE-29096.
const RefreshVotingPowerFlowModal = () => null;

export default RefreshVotingPowerFlowModal;
