import { Flex } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import { Close, Image, Subtitle, Tag, Title } from "~/contentCards/cards/horizontal/elements";
import { ContentCardMetadata } from "~/contentCards/types";

type Props = {
  title: string;
  subtitle: string;
  image: string;
  tag?: string;
} & ContentCardMetadata;

const HorizontalCard = ({ title, subtitle, image, tag, metadata }: Props) => {
  const { colors, space } = useTheme();

  const isDismissable = !!metadata.onDismiss;
  const isTag = !!tag;

  return (
    <TouchableOpacity onPress={metadata.onClick}>
      <Flex
        bg={colors.opacityDefault.c05}
        p="13px"
        borderRadius="12px"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        columnGap={13}
      >
        <Image uri={image} />

        <Flex flexGrow={1} rowGap={space[2]}>
          <Flex flexDirection="row" justifyContent="space-between" columnGap={space[3]}>
            <Flex overflow={"hidden"} flex={1}>
              <Title label={title} />
            </Flex>

            <Flex alignSelf="center" height="16px">
              {isDismissable ? (
                <Close onPress={metadata.onDismiss} />
              ) : (
                isTag && <Tag label={tag} />
              )}
            </Flex>
          </Flex>

          <Subtitle label={subtitle} />
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
};

export default HorizontalCard;
