import React, { useState } from "react";
import ContentCard from "./ContentCard";
import KeyboardView from "~/components/KeyboardView";
import NavigationScrollView from "~/components/NavigationScrollView";
import { CardType } from "./types";
import { Pressable } from "react-native";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";

export default function DebugContentCards() {
  const [focusedCardTypeId, setFocusedCardTypeId] = useState<string | undefined>();
  const isFocused = (id: string) => focusedCardTypeId === id;
  const [cardTitle, setCardTitle] = useState("");
  const [cardDescription, setCardDescription] = useState("");
  const cardsTypes: CardType[] = [
    {
      id: "wallet_card",
      name: "Wallet Card",
      fields: [
        {
          name: "Title",
          value: cardTitle,
          setValue: setCardTitle,
        },
        {
          name: "Description",
          value: cardDescription,
          setValue: setCardDescription,
        },
      ],
      onCreate: () => {},
    },
  ];

  return (
    <KeyboardView style={{ marginTop: 16 }}>
      <NavigationScrollView>
        {cardsTypes.map(card => (
          <Pressable
            key={card.id}
            onPress={() => setFocusedCardTypeId(isFocused(card.id) ? undefined : card.id)}
            style={{ padding: 8 }}
          >
            <Flex flexDirection="row">
              {isFocused(card.id) ? (
                <Icons.ChevronUp size="M" color="black" />
              ) : (
                <Icons.ChevronDown size="M" color="black" />
              )}
              <Text variant="large" mb={4} ml={2} alignSelf={"center"}>
                {card.name}
              </Text>
            </Flex>
            {isFocused(card.id) ? <ContentCard card={card} /> : null}
          </Pressable>
        ))}
      </NavigationScrollView>
    </KeyboardView>
  );
}
