import { Section } from "../../components/Section";
import { NetworkField } from "../../components/NetworkField";
import type { AccountPortfolioViewModel } from "../../AccountPortfolio/types";
import { BroadcastSection } from "./BroadcastSection";
import { CombineSection } from "./CombineSection";
import { IntentSection } from "./IntentSection";

/** Build a transaction, add its signature, then send it: the chain-side writes of the service. */
export function WriteTab(vm: Readonly<AccountPortfolioViewModel>) {
  return (
    <>
      <Section
        title="Network"
        description="The chain of every call below. It is the one of the Networks tab."
      >
        <NetworkField network={vm.network} setNetwork={vm.setNetwork} />
      </Section>
      <IntentSection {...vm} />
      <CombineSection {...vm} />
      <BroadcastSection {...vm} />
    </>
  );
}
