import React, { useMemo, memo } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import styled from "@ledgerhq/native-ui/components/styled";
import { TouchableOpacity, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import BaseSkeleton from "../../components/Skeleton";

// FIXME: PRETTY SURE THIS FILE WAS NOT USED, SO WE REMOVED ALL
// ERRORS (WRONG PASSED PROPS) BECAUSE THEY WOULD JUST NOT WORK
// THE GOOD THING IS, SINCE IT WAS NOT USED YET IN PRODUCTION
// WE CAN GO OVER THIS WHENEVER WE DECIDE TO WORK ON IT AGAIN

const Skeleton = styled(BaseSkeleton).attrs({
  backgroundColor: "neutral.c30",
})``;

const PlaceholderBig = styled(Skeleton).attrs({ loading: true })`
  border-radius: 4px;
`;
const PlaceholderMedium = styled(Skeleton).attrs({ loading: true })`
  border-radius: 2px;
  height: 10px;
`;
const PlaceholderSmall = styled(Skeleton).attrs({ loading: true })`
  border-radius: 1px;
  height: 6px;
`;

const Container = styled(Flex).attrs({
  width: "100%",
  flexDirection: "column",
  alignItems: "stretch",
})``;

const TitleContainer = styled(Flex).attrs({
  height: "48px",
  alignItems: "center",
})``;

const ScrollContainer = styled(ScrollView).attrs({
  horizontal: true,
  contentContainerStyle: {
    paddingLeft: 16,
    paddingRight: 4,
  },
})``;

const PlaceholderShow = styled(PlaceholderBig).attrs({
  marginRight: "12px",
  height: 229,
  width: 159,
})``;

const PlaceholderVideo = () => (
  <Flex flexDirection="column" mr="12px">
    <PlaceholderBig />
    <PlaceholderMedium />
    <PlaceholderSmall />
  </Flex>
);

const PlaceholderPodcast = () => (
  <Flex flexDirection="column" mr="12px">
    <PlaceholderBig />
    <PlaceholderMedium />
    <PlaceholderSmall />
  </Flex>
);

const PlaceholderArticle = () => (
  <Flex
    flexDirection="row"
    alignItems="flex-start"
    mr="12px"
    mb="20px"
    width={269}
  >
    <PlaceholderBig />
    <Flex flex={1} flexDirection="column">
      <PlaceholderMedium />
      <PlaceholderMedium />
      <PlaceholderSmall />
    </Flex>
  </Flex>
);

type SectionProps = {
  title?: string;
  children?: React.ReactNode;
};

function SectionHeader({ title }: SectionProps) {
  const { t } = useTranslation();
  return (
    <Flex
      flexDirection="row"
      justifyContent="space-between"
      mb="16px"
      px="16px"
    >
      <Text variant="h3">{title}</Text>
      <TouchableOpacity>
        <Text variant="body" fontWeight="semiBold" color="primary.c80">
          {t("common.seeAll")}
        </Text>
      </TouchableOpacity>
    </Flex>
  );
}

function Section({ title, children }: SectionProps) {
  return (
    <Flex mb="40px">
      {title && <SectionHeader title={title} />}
      <ScrollContainer
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      >
        {children}
      </ScrollContainer>
    </Flex>
  );
}

function LearnSkeleton() {
  const { t } = useTranslation();
  const emptyArray = useMemo(() => new Array(4).fill(undefined), []);
  return (
    <Container>
      <TitleContainer>
        <Text variant="h3">{t("learn.pageTitle")}</Text>
      </TitleContainer>
      <ScrollView scrollEnabled={false} showsVerticalScrollIndicator={false}>
        <Section title={t("learn.sectionShows")}>
          {emptyArray.map((i, key) => (
            <PlaceholderShow key={key} />
          ))}
        </Section>
        <Section title={t("learn.sectionVideo")}>
          {emptyArray.map((i, key) => (
            <PlaceholderVideo key={key} />
          ))}
        </Section>
        <Section title={t("learn.sectionPodcast")}>
          {emptyArray.map((i, key) => (
            <PlaceholderPodcast key={key} />
          ))}
        </Section>
        <Section title={t("learn.sectionArticles")}>
          {emptyArray.map((i, key) => (
            <Flex key={key} flexDirection="column">
              <PlaceholderArticle />
              <PlaceholderArticle />
            </Flex>
          ))}
        </Section>
      </ScrollView>
    </Container>
  );
}

export default memo(LearnSkeleton);
