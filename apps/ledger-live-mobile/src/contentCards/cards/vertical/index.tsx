import { Flex } from "@ledgerhq/native-ui";
import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { ContentCardBuilder } from "~/contentCards/cards/utils";
import {
  Close,
  Container,
  Media,
  SubDescription,
  Description,
  Tag,
  Title,
  Button,
} from "./elements";
import { Size } from "./types";
import { WidthFactor } from "~/contentCards/layouts/types";

type Props = {
  tag?: string;
  title?: string;
  description?: string;
  subDescription?: string;
  descriptionTextAlign?: CanvasTextAlign;
  titleTextAlign?: CanvasTextAlign;
  cta?: string;
  size: Size;
  media: string;
  filledMedia?: boolean;
  mediaType?: "video" | "image" | "gif";
  widthFactor: WidthFactor;
};

const VerticalCard = ContentCardBuilder<Props>(
  ({
    title,
    titleTextAlign = "left",
    description,
    descriptionTextAlign = "left",
    subDescription,
    media,
    tag,
    size,
    metadata,
    cta,
    filledMedia,
    widthFactor,
    mediaType = "image",
  }) => {
    useEffect(() => metadata.actions?.onView?.());
    const hasCta = cta && size === "L";
    const hasSubDescription = !hasCta && subDescription;
    const isMediaOnly = !title && !description && !subDescription && !cta;
    if (!media && isMediaOnly) return null;
    return (
      <TouchableOpacity onPress={metadata.actions?.onClick}>
        {tag && <Tag size={size} label={tag} />}
        {metadata.actions?.onDismiss && <Close onPress={metadata.actions?.onDismiss} />}
        <Container size={size} widthFactor={widthFactor} isMediaOnly={isMediaOnly}>
          {media && (
            <Media
              uri={media}
              mediaType={mediaType}
              size={size}
              filledImage={filledMedia}
              isMediaOnly={isMediaOnly}
            />
          )}
          {!isMediaOnly ? (
            <Flex px={6} pt={tag ? 8 : 4}>
              {title && <Title size={size} label={title} textAlign={titleTextAlign} />}
              {description && (
                <Description size={size} label={description} textAlign={descriptionTextAlign} />
              )}
              {hasSubDescription && <SubDescription size={size} label={subDescription} />}
              {hasCta && (
                <Button
                  size={size}
                  textAlign={descriptionTextAlign}
                  label={cta}
                  action={metadata.actions?.onClick}
                />
              )}
            </Flex>
          ) : null}
        </Container>
      </TouchableOpacity>
    );
  },
);

export default VerticalCard;
