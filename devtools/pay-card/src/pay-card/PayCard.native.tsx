import { useState } from "react";
import { ScrollView } from "react-native";
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
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, CoinsCrypto, CreditCard, Coins } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { PayCardToolProps } from "../types";
import { Section } from "../components/Section/Section";
import { ToggleRow } from "../components/ToggleRow/ToggleRow";
import { EnvVarRow } from "../components/EnvVarRow/EnvVarRow";
import { Interaction } from "../components/Interaction/Interaction";
import { BalanceScreen } from "../components/Balance/Balance";
import { CurrencyMappingScreen } from "../components/CurrencyMapping/CurrencyMapping";

const BUTTON_ROW_STYLE = { flexDirection: "row", flexWrap: "wrap", gap: 8 } as const;

export function PayCard(props: Readonly<PayCardToolProps>) {
  const {
    flags,
    onboarding,
    interaction,
    balance,
    currencyMapping,
    hasSeenFeatureTour,
    resetPayCardFeatureTourSeen,
    hasSeenReceiveVerifyHint,
    resetReceiveVerifyHintSeen,
    onNavigateToPortfolio,
    onNavigateToPayTab,
    env,
  } = props;
  const [screen, setScreen] = useState<"tool" | "interaction" | "balance" | "mapping">("tool");

  if (screen === "interaction") {
    return <Interaction {...interaction} onBack={() => setScreen("tool")} />;
  }

  if (screen === "balance") {
    return <BalanceScreen {...balance} onBack={() => setScreen("tool")} />;
  }

  if (screen === "mapping") {
    return <CurrencyMappingScreen rows={currencyMapping} onBack={() => setScreen("tool")} />;
  }

  return (
    <ScrollView>
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

        <ListItem onPress={() => setScreen("mapping")}>
          <ListItemLeading>
            <Spot appearance="icon" icon={Coins} />
            <ListItemContent>
              <ListItemTitle>Currency Mapping</ListItemTitle>
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
          <Button appearance="gray" size="sm" onPress={() => onboarding.setStepDone("all", false)}>
            Reset onboarding widget
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

      <Section title="Env vars">
        <Text typography="body4" lx={{ color: "muted" }}>
          Applied at once, and not saved: a restart brings the build's values back.
        </Text>
        {env.vars.map(envVar => (
          <EnvVarRow key={envVar.key} envVar={envVar} onSet={env.setVar} />
        ))}
      </Section>
    </ScrollView>
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
