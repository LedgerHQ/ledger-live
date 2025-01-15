import { Flex, SideImageCard } from "@ledgerhq/native-ui";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import React, { useCallback } from "react";
import { Linking } from "react-native";
import LogContentCardWrapper from "LLM/features/DynamicContent/components/LogContentCardWrapper";
import useDynamicContent from "~/dynamicContent/useDynamicContent";

type Props = {
  currency: CryptoOrTokenCurrency;
};

const AssetDynamicContent: React.FC<Props> = ({ currency }) => {
  const { getAssetCardByIdOrTicker, logClickCard, dismissCard, trackContentCardEvent } =
    useDynamicContent();
  const dynamicContentCard = getAssetCardByIdOrTicker(currency);

  const onClickLink = useCallback(() => {
    if (!dynamicContentCard) return;
    if (!dynamicContentCard.link) return;

    trackContentCardEvent("contentcard_clicked", {
      screen: dynamicContentCard.location,
      link: dynamicContentCard.link,
      campaign: dynamicContentCard.id,
    });

    // Notify Braze that the card has been clicked by the user
    logClickCard(dynamicContentCard.id);
    Linking.openURL(dynamicContentCard.link);
  }, [dynamicContentCard, logClickCard, trackContentCardEvent]);

  const onPressDismiss = useCallback(() => {
    if (!dynamicContentCard) return;

    trackContentCardEvent("contentcard_dismissed", {
      screen: dynamicContentCard.location,
      link: dynamicContentCard.link || "",
      campaign: dynamicContentCard.id,
    });

    dismissCard(dynamicContentCard.id);
  }, [dismissCard, dynamicContentCard, trackContentCardEvent]);

  if (!dynamicContentCard) return null;

  return (
    <LogContentCardWrapper id={dynamicContentCard.id}>
      <Flex mt={6}>
        <SideImageCard
          title={dynamicContentCard.title}
          tag={dynamicContentCard.tag}
          cta={dynamicContentCard.cta}
          imageUrl={dynamicContentCard.image}
          onPress={onClickLink}
          onPressDismiss={onPressDismiss}
        />
      </Flex>
    </LogContentCardWrapper>
  );
};

export default React.memo(AssetDynamicContent);
