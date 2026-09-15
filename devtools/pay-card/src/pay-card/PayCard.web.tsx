import { useState } from "react";
import {
  Button,
  Divider,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, CoinsCrypto } from "@ledgerhq/lumen-ui-react/symbols";
import type { PayCardToolProps } from "../types";
import { Section } from "../components/Section/Section";
import { ToggleRow } from "../components/ToggleRow/ToggleRow";
import { BalanceScreen } from "../components/Balance/Balance";
import { AuthSection } from "./AuthSection";

export function PayCard(props: Readonly<PayCardToolProps>) {
  const {
    flags,
    onboarding,
    balance,
    hasSeenFeatureTour,
    resetPayCardFeatureTourSeen,
    hasSeenReceiveVerifyHint,
    resetReceiveVerifyHintSeen,
    hasCompletedCardOnboarding,
    resetCardOnboarding,
    onNavigateToPortfolio,
    onNavigateToPayTab,
    hasSeenLoginIntro,
    resetPayCardLoginIntroSeen,
    onNavigateToPaySuccess,
    onNavigateToSendSuccess,
    auth,
  } = props;
  const hasQuickActions = Boolean(
    onNavigateToPortfolio ||
    onNavigateToPayTab ||
    onNavigateToPaySuccess ||
    onNavigateToSendSuccess,
  );
  const [screen, setScreen] = useState<"tool" | "balance">("tool");

  if (screen === "balance") {
    return <BalanceScreen {...balance} onBack={() => setScreen("tool")} />;
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {auth ? (
        <>
          <AuthSection auth={auth} />
          <Divider />
        </>
      ) : null}
      <Section title="Card Debug">
        <ListItem
          onClick={() => {
            balance.load();
            setScreen("balance");
          }}
        >
          <ListItemLeading>
            <Spot appearance="icon" icon={CoinsCrypto} />
            <ListItemContent>
              <ListItemTitle>Balance & Wallets</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
          <ListItemTrailing>
            <ChevronRight />
          </ListItemTrailing>
        </ListItem>
      </Section>

      <Divider />

      <Section title="Feature flags">
        <ToggleRow
          label="Pay tab"
          description="lwdPayTab / lwmPayTab"
          checked={flags.payTabEnabled}
          onChange={flags.setPayTabEnabled}
        />
        <ToggleRow
          label="Card param"
          description="params.card"
          checked={flags.cardParam}
          onChange={flags.setCardParam}
        />
        <ToggleRow
          label="Legacy Card"
          description="ptxCard"
          checked={flags.ptxCardEnabled}
          onChange={flags.setPtxCardEnabled}
        />
      </Section>

      <Divider />

      <Section title="Onboarding">
        <div className="flex flex-col gap-2">
          {onboarding.steps.map(step => (
            <ToggleRow
              key={step.id}
              label={step.label}
              checked={step.done}
              onChange={() => onboarding.setStepDone(step.id, !step.done)}
            />
          ))}
        </div>
      </Section>

      <Divider />

      <Section title="Reset onboarding">
        <div className="flex flex-wrap gap-8">
          <Button appearance="gray" size="sm" onClick={() => onboarding.setStepDone("all", true)}>
            Set all done
          </Button>
          <Button appearance="gray" size="sm" onClick={() => onboarding.setStepDone("all", false)}>
            Reset all
          </Button>
        </div>
      </Section>

      <Divider />

      <SeenReset
        title="Feature tour"
        seen={hasSeenFeatureTour}
        resetLabel="Reset feature tour"
        onReset={resetPayCardFeatureTourSeen}
      />

      <Divider />

      <SeenReset
        title="Request verify hint"
        seen={hasSeenReceiveVerifyHint}
        resetLabel="Reset verify hint"
        onReset={resetReceiveVerifyHintSeen}
      />

      <Divider />

      <SeenReset
        title="Onboarding completed"
        seen={hasCompletedCardOnboarding}
        resetLabel="Reset onboarding completion"
        onReset={resetCardOnboarding}
      />

      {hasQuickActions ? (
        <>
          <Divider />
          <Section title="Quick actions">
            <div className="flex flex-wrap gap-8">
              {onNavigateToPortfolio ? (
                <Button appearance="gray" size="sm" onClick={onNavigateToPortfolio}>
                  Go to Portfolio
                </Button>
              ) : null}
              {onNavigateToPayTab ? (
                <Button appearance="gray" size="sm" onClick={onNavigateToPayTab}>
                  Go to Pay tab
                </Button>
              ) : null}
              {onNavigateToPaySuccess ? (
                <Button appearance="gray" size="sm" onClick={onNavigateToPaySuccess}>
                  Pay contact success
                </Button>
              ) : null}
              {onNavigateToSendSuccess ? (
                <Button appearance="gray" size="sm" onClick={onNavigateToSendSuccess}>
                  Send success
                </Button>
              ) : null}
            </div>
          </Section>
        </>
      ) : null}

      <Divider />

      <SeenReset
        title="Card login intro"
        seen={hasSeenLoginIntro}
        resetLabel="Reset card login intro"
        onReset={resetPayCardLoginIntroSeen}
      />
    </div>
  );
}

function SeenReset({
  title,
  seen,
  resetLabel,
  onReset,
}: Readonly<{
  title: string;
  seen: boolean;
  resetLabel: string;
  onReset: () => void;
}>) {
  return (
    <Section title={title}>
      <div>
        <Tag size="sm" appearance={seen ? "success" : "gray"} label={seen ? "Seen" : "Not seen"} />
      </div>
      <div className="flex flex-wrap gap-8">
        <Button appearance="gray" size="sm" onClick={onReset}>
          {resetLabel}
        </Button>
      </div>
    </Section>
  );
}

export default PayCard;
