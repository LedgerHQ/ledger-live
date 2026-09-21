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
import {
  CheckmarkCircle,
  ChevronRight,
  Coins,
  CoinsCrypto,
  CreditCard,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import type { PayCardToolProps } from "../types";
import { Section } from "../components/Section/Section";
import { ToggleRow } from "../components/ToggleRow/ToggleRow";
import { Interaction } from "../components/Interaction/Interaction";
import { BalanceScreen } from "../components/Balance/Balance";
import { CardOnboardingScreen } from "../components/CardOnboarding/CardOnboarding";
import { CurrencyMappingScreen } from "../components/CurrencyMapping/CurrencyMapping";
import { ReorderMock } from "../components/ReorderMock/ReorderMock";
import { TransactionsScreen } from "../components/Transactions/Transactions";
import { AuthSection } from "./AuthSection";
import { ResultToast } from "./ResultToast";
import { SecureBrowserSection } from "./SecureBrowserSection";

const BUTTON_ROW_STYLE = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
} as const;
const PANEL_STYLE = { flex: 1 } as const;

type SubScreenName = "interaction" | "balance" | "onboarding" | "mapping" | "transactions";

function SubScreen({
  screen,
  interaction,
  balance,
  transactions,
  cardOnboarding,
  currencyMapping,
  onBack,
}: Readonly<{
  screen: SubScreenName;
  interaction: PayCardToolProps["interaction"];
  balance: PayCardToolProps["balance"];
  transactions: PayCardToolProps["transactions"];
  cardOnboarding: PayCardToolProps["cardOnboarding"];
  currencyMapping: PayCardToolProps["currencyMapping"];
  onBack: () => void;
}>) {
  if (screen === "interaction") return <Interaction {...interaction} onBack={onBack} />;
  if (screen === "balance") return <BalanceScreen {...balance} onBack={onBack} />;
  if (screen === "onboarding") return <CardOnboardingScreen {...cardOnboarding} onBack={onBack} />;
  if (screen === "transactions") return <TransactionsScreen {...transactions} onBack={onBack} />;
  return <CurrencyMappingScreen rows={currencyMapping} onBack={onBack} />;
}

export function PayCard(props: Readonly<PayCardToolProps>) {
  const {
    flags,
    cardOnboarding,
    interaction,
    balance,
    transactions,
    reorder,
    currencyMapping,
    hasSeenFeatureTour,
    resetPayCardFeatureTourSeen,
    hasSeenReceiveVerifyHint,
    resetReceiveVerifyHintSeen,
    hasCompletedCardOnboarding,
    resetCardOnboarding,
    onNavigateToPortfolio,
    onNavigateToPayTab,
    onNavigateToPaySuccess,
    onNavigateToSendSuccess,
    hasSeenLoginIntro,
    resetPayCardLoginIntroSeen,
    auth,
    openSecureBrowser,
  } = props;
  const hasQuickActions = Boolean(
    onNavigateToPortfolio ||
    onNavigateToPayTab ||
    onNavigateToPaySuccess ||
    onNavigateToSendSuccess,
  );
  const [screen, setScreen] = useState<"tool" | SubScreenName>("tool");

  if (screen !== "tool") {
    return (
      <SubScreen
        screen={screen}
        interaction={interaction}
        balance={balance}
        transactions={transactions}
        cardOnboarding={cardOnboarding}
        currencyMapping={currencyMapping}
        onBack={() => setScreen("tool")}
      />
    );
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
                <ListItemTitle>Balance & Wallets</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing>
              <ChevronRight />
            </ListItemTrailing>
          </ListItem>

          <ListItem onPress={() => setScreen("transactions")}>
            <ListItemLeading>
              <Spot appearance="icon" icon={CreditCard} />
              <ListItemContent>
                <ListItemTitle>Transactions</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing>
              <ChevronRight />
            </ListItemTrailing>
          </ListItem>

          <ListItem
            onPress={() => {
              cardOnboarding.refresh();
              setScreen("onboarding");
            }}
          >
            <ListItemLeading>
              <Spot appearance="icon" icon={CheckmarkCircle} />
              <ListItemContent>
                <ListItemTitle>Card onboarding</ListItemTitle>
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

        {reorder.available ? (
          <>
            <Divider />
            <ReorderMock {...reorder} />
          </>
        ) : null}

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
                {onNavigateToPaySuccess ? (
                  <Button appearance="gray" size="sm" onPress={onNavigateToPaySuccess}>
                    Pay contact success
                  </Button>
                ) : null}
                {onNavigateToSendSuccess ? (
                  <Button appearance="gray" size="sm" onPress={onNavigateToSendSuccess}>
                    Send success
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
