import { Image, Pressable, ScrollView } from "react-native";
import { Box, Button, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import type {
  PayCardDetailsCssProps,
  PayCardDetailsImageProps,
  PayCardInteractionProps,
} from "../../types";

export interface InteractionProps extends PayCardInteractionProps {
  readonly onBack: () => void;
}

const CONTAINER_LX = { gap: "s12", padding: "s16" } as const;
const PROBE_LX = { gap: "s8" } as const;
const BUTTON_ROW_LX = { flexDirection: "row", flexWrap: "wrap", gap: "s8" } as const;

/**
 * The provider bakes these into the image, so they are chosen per colour scheme and a fresh token is
 * needed to change them. The PAN strip sits a shade off the card body — pure black or white against
 * the card's own near-black or near-white — so the card number reads as its own surface.
 */
const detailsCss = (isDark: boolean): PayCardDetailsCssProps => ({
  cardBackgroundColor: isDark ? "#1f1f1f" : "#f1f1f1",
  cardTextColor: isDark ? "#ffffff" : "#000000",
  panBackgroundColor: isDark ? "#000000" : "#ffffff",
  panTextColor: isDark ? "#ffffff" : "#000000",
});

// The provider renders the details at its own size; contain rather than crop what it sends back.
const CARD_IMAGE_STYLE = { width: "100%", aspectRatio: 16 / 9 } as const;

/**
 * Stands in for the card details until a developer asks for them, then shows the image the provider
 * rendered. The URL is the credential, so it loads with no headers and is never shown as text.
 */
function CardDetails({ imageUrl, isFetching, error, request }: PayCardDetailsImageProps) {
  const { colorScheme } = useTheme();
  if (imageUrl !== undefined) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={CARD_IMAGE_STYLE}
        resizeMode="contain"
        accessibilityLabel="Card details"
      />
    );
  }

  return (
    <Pressable onPress={() => request(detailsCss(colorScheme === "dark"))} disabled={isFetching}>
      <Box
        lx={{
          borderWidth: "s1",
          borderColor: "mutedSubtle",
          borderRadius: "lg",
          alignItems: "center",
          justifyContent: "center",
          gap: "s8",
        }}
        style={CARD_IMAGE_STYLE}
      >
        {isFetching ? <Spinner /> : null}
        <Text typography="body2" lx={{ color: "muted" }}>
          {isFetching ? "Requesting…" : "Request Card Details"}
        </Text>
        {error === undefined ? null : (
          <Text typography="body3" lx={{ color: "error" }}>
            {error}
          </Text>
        )}
      </Box>
    </Pressable>
  );
}

export function Interaction({ probes, details, onBack }: InteractionProps) {
  return (
    <ScrollView>
      <Box lx={CONTAINER_LX}>
        <Box lx={BUTTON_ROW_LX}>
          <Button
            appearance="gray"
            size="sm"
            onPress={() => {
              // Drop the minted URL: it is single-use, so coming back must mint a fresh one.
              details.clear();
              onBack();
            }}
          >
            Back
          </Button>
        </Box>

        <CardDetails {...details} />

        {probes.map(probe => (
          <Box key={probe.id} lx={PROBE_LX}>
            <Box lx={BUTTON_ROW_LX}>
              <Button appearance="accent" size="sm" loading={probe.isFetching} onPress={probe.run}>
                {probe.label}
              </Button>
            </Box>
            {probe.error === undefined ? null : (
              <Text typography="body3" lx={{ color: "error" }}>
                {probe.error}
              </Text>
            )}
            {probe.result === undefined ? null : (
              <Text typography="body3" lx={{ color: "muted" }}>
                {probe.result}
              </Text>
            )}
          </Box>
        ))}
      </Box>
    </ScrollView>
  );
}
