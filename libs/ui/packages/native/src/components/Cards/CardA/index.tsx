import React from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Flex, Text, Icon } from "../../index";
import BackgroundGradient from "./Gradient";

type Props = {
  variant?: string;
};

const CardA = ({ variant = "A" }: Props): React.ReactElement => {
  return (
    <Flex borderRadius={8}>
      <BackgroundGradient color="#7A292A" style={{ borderRadius: 8 }} />
      <Flex p={6}>
        <Flex flexDirection="row" justifyContent="space-between" mb={3}>
          <Flex bg="neutral.c100a01" borderRadius={6} px={3} py="6px" maxWidth="80%">
            <Text variant="small" fontWeight="semiBold" color="neutral.c90" numberOfLines={1}>
              Promo
            </Text>
          </Flex>
          <TouchableOpacity>
            <Flex bg="neutral.c30" top={-8} right={-8} p="6px" borderRadius={24}>
              <Icon name="Close" size={12} color="neutral.c100" />
            </Flex>
          </TouchableOpacity>
        </Flex>
        <Text
          variant="h4"
          fontWeight="semiBold"
          color="neutral.c100"
          numberOfLines={3}
          height="84px"
        >
          Grow your assets, Stake again with{" "}
          <Text variant="h4" fontWeight="semiBold" color="primary.c80">
            Lido
          </Text>
          .
        </Text>
      </Flex>
    </Flex>
  );
};

export default CardA;
