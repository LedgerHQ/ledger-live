import React, { useMemo } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import styled from "@ledgerhq/native-ui/components/styled";
import { TouchableOpacity, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import Skeleton from "../../components/Skeleton";

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
    <PlaceholderBig height={112} width={200} mb="12px" />
    <PlaceholderMedium width="80%" mb="7px" />
    <PlaceholderSmall width="60%" />
  </Flex>
);

const PlaceholderPodcast = () => (
  <Flex flexDirection="column" mr="12px">
    <PlaceholderBig height={120} width={120} mb="8px" />
    <PlaceholderMedium width="100%" mb="7px" />
    <PlaceholderSmall width="70%" />
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
    <PlaceholderBig height={53} width={53} mr="16px" />
    <Flex flex={1} flexDirection="column">
      <PlaceholderMedium width="100%" mb="7px" />
      <PlaceholderMedium width="55%" mb="7px" />
      <PlaceholderSmall width="15%" />
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
      <ScrollContainer>{children}</ScrollContainer>
    </Flex>
  );
}

export default function LearnSkeleton() {
  const { t } = useTranslation();
  const emptyArray = useMemo(() => new Array(4).fill(undefined), []);
  return (
    <Container>
      <TitleContainer>
        <Text variant="h3">{t("learn.pageTitle")}</Text>
      </TitleContainer>
      <ScrollView>
        <Section title={t("learn.sectionShows")}>
          {emptyArray.map(() => (
            <PlaceholderShow />
          ))}
        </Section>
        <Section title={t("learn.sectionVideo")}>
          {emptyArray.map(() => (
            <PlaceholderVideo />
          ))}
        </Section>
        <Section title={t("learn.sectionPodcast")}>
          {emptyArray.map(() => (
            <PlaceholderPodcast />
          ))}
        </Section>
        <Section title={t("learn.sectionArticles")}>
          {emptyArray.map(() => (
            <Flex flexDirection="column">
              <PlaceholderArticle />
              <PlaceholderArticle />
            </Flex>
          ))}
        </Section>
      </ScrollView>
    </Container>
  );
}
