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
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, CreditCard } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { PayCardToolProps } from "../types";
import { Section } from "../components/Section/Section";
import { ToggleRow } from "../components/ToggleRow/ToggleRow";
import { Interaction } from "../components/Interaction/Interaction";

const BUTTON_ROW_STYLE = { flexDirection: "row", flexWrap: "wrap", gap: 8 } as const;

export function PayCard(props: Readonly<PayCardToolProps>) {
  const { flags, onboarding, interaction, hasSeenFeatureTour, resetPayCardFeatureTourSeen } = props;
  const [showInteraction, setShowInteraction] = useState(false);

  if (showInteraction) {
    return <Interaction {...interaction} onBack={() => setShowInteraction(false)} />;
  }

  return (
    <ScrollView>
      <ListItem onPress={() => setShowInteraction(true)} testID="pay-card-open-interaction">
        <ListItemLeading lx={{ paddingHorizontal: "s16" }}>
          <Spot appearance="icon" icon={CreditCard} />
          <ListItemContent>
            <ListItemTitle>Card interaction</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing lx={{ paddingHorizontal: "s16" }}>
          <ChevronRight />
        </ListItemTrailing>
      </ListItem>

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

      <Section title="Feature tour">
        <Box style={BUTTON_ROW_STYLE}>
          <Tag
            size="sm"
            appearance={hasSeenFeatureTour ? "success" : "gray"}
            label={hasSeenFeatureTour ? "Seen" : "Not seen"}
          />
        </Box>
        <Box style={BUTTON_ROW_STYLE}>
          <Button appearance="gray" size="sm" onPress={resetPayCardFeatureTourSeen}>
            Reset feature tour
          </Button>
        </Box>
      </Section>
    </ScrollView>
  );
}

export default PayCard;
