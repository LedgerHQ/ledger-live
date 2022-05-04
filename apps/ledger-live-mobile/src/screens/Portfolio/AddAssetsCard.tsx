import React, { useCallback, useState } from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { PlusMedium } from "@ledgerhq/native-ui/assets/icons";
import { Trans } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";
import Illustration from "../../images/illustration/Illustration";
import PileOfBitcoinDark from "../../images/illustration/Dark/_002.png";
import PileOfBitcoinLight from "../../images/illustration/Light/_002.png";
import { NavigatorName } from "../../const";

export const AddAssetsCard = () => {
  const navigation = useNavigation();
  const [isAddModalOpened, setAddModalOpened] = useState(false);

  const openAddModal = useCallback(() => setAddModalOpened(true), [
    setAddModalOpened,
  ]);

  const closeAddModal = useCallback(() => setAddModalOpened(false), [
    setAddModalOpened,
  ]);

  const goToBuy = useCallback(
    () => navigation.navigate(NavigatorName.Exchange),
    [navigation],
  );

  return (
    <Flex bg={"neutral.c30"} alignItems={"center"} p={7} borderRadius={2}>
      <Illustration
        lightSource={PileOfBitcoinLight}
        darkSource={PileOfBitcoinDark}
        size={126}
      />
      <Text variant={"h2"} color={"neutral.c100"} mt={7}>
        <Trans i18nKey="portfolio.emptyState.addAccounts.title" />
      </Text>
      <Text variant={"bodyLineHeight"} color={"neutral.c70"} mt={4}>
        <Trans i18nKey="portfolio.emptyState.addAccounts.description" />
      </Text>
      <Button
        onPress={goToBuy}
        size={"medium"}
        type={"color"}
        Icon={PlusMedium}
        iconPosition={"left"}
        mt={8}
        width={"100%"}
      >
        <Trans i18nKey="portfolio.emptyState.buttons.buy" />
      </Button>
      <Button
        onPress={openAddModal}
        size={"medium"}
        type={"shade"}
        outline
        mt={6}
        width={"100%"}
      >
        <Trans i18nKey="portfolio.emptyState.buttons.import" />
      </Button>
      <AddAccountsModal
        navigation={navigation}
        isOpened={isAddModalOpened}
        onClose={closeAddModal}
      />
    </Flex>
  );
};

export default AddAssetsCard;
