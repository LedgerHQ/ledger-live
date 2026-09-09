import { useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Box,
  Button,
  Divider,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
  Tag,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, CoinsCrypto, CreditCard } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { PayCardToolProps } from "../types";
import { Section } from "../components/Section/Section";
import { ToggleRow } from "../components/ToggleRow/ToggleRow";
import { Interaction } from "../components/Interaction/Interaction";
import { BalanceScreen } from "../components/Balance/Balance";
import { AuthSection } from "./AuthSection";
import { ResultToast } from "./ResultToast";
import { SecureBrowserSection } from "./SecureBrowserSection";

const BUTTON_ROW_STYLE = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
} as const;
const PANEL_STYLE = { flex: 1 } as const;

export function PayCard(props: Readonly<PayCardToolProps>) {
  const {
    flags,
    onboarding,
    interaction,
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
    auth,
    openSecureBrowser,
  } = props;
  const [screen, setScreen] = useState<"tool" | "interaction" | "balance">("tool");

  if (screen === "interaction") {
    return <Interaction {...interaction} onBack={() => setScreen("tool")} />;
  }

  if (screen === "balance") {
    return <BalanceScreen {...balance} onBack={() => setScreen("tool")} />;
  }

  return (
    <View style={PANEL_STYLE}>
      <ScrollView>
        {auth ? (
          <>
            <AuthSection auth={auth} />
            <Divider />
          </>
        ) : null}

        <Section title="Card Debug">
          <ListItem onPress={() => setScreen("interaction")}>
            <ListItemLeading>
              <Spot appearance="icon" icon={CreditCard} />
              <ListItemContent>
                <ListItemTitle>Card interaction</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing>
              <ChevronRight />
            </ListItemTrailing>
          </ListItem>

          <ListItem
            onPress={() => {
              balance.load();
              setScreen("balance");
            }}
          >
            <ListItemLeading>
              <Spot appearance="icon" icon={CoinsCrypto} />
              <ListItemContent>
                <ListItemTitle>Balance</ListItemTitle>
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
          <Box lx={{ flexDirection: "column", gap: "s8" }}>
            {onboarding.steps.map(step => (
              <ToggleRow
                key={step.id}
                label={step.label}
                checked={step.done}
                onChange={() => onboarding.setStepDone(step.id, !step.done)}
              />
            ))}
          </Box>
        </Section>

        <Divider />

        <Section title="Reset onboarding">
          <Box style={BUTTON_ROW_STYLE}>
            <Button appearance="gray" size="sm" onPress={() => onboarding.setStepDone("all", true)}>
              Set all done
            </Button>
            <Button
              appearance="gray"
              size="sm"
              onPress={() => onboarding.setStepDone("all", false)}
            >
              Reset all
            </Button>
          </Box>
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

        {onNavigateToPortfolio || onNavigateToPayTab ? (
          <>
            <Divider />
            <Section title="Quick actions">
              <Box style={BUTTON_ROW_STYLE}>
                {onNavigateToPortfolio ? (
                  <Button appearance="gray" size="sm" onPress={onNavigateToPortfolio}>
                    Go to Portfolio
                  </Button>
                ) : null}
                {onNavigateToPayTab ? (
                  <Button appearance="gray" size="sm" onPress={onNavigateToPayTab}>
                    Go to Pay tab
                  </Button>
                ) : null}
              </Box>
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

        {openSecureBrowser ? (
          <>
            <Divider />
            <SecureBrowserSection open={openSecureBrowser} />
          </>
        ) : null}
      </ScrollView>
      {auth ? <ResultToast result={auth.lastResult} /> : null}
    </View>
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
      <Box style={BUTTON_ROW_STYLE}>
        <Tag size="sm" appearance={seen ? "success" : "gray"} label={seen ? "Seen" : "Not seen"} />
      </Box>
      <Box style={BUTTON_ROW_STYLE}>
        <Button appearance="gray" size="sm" onPress={onReset}>
          {resetLabel}
        </Button>
      </Box>
    </Section>
  );
}

export default PayCard;
