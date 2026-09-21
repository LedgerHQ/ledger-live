import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { Flex, Input, Text } from "@ledgerhq/react-ui";
import { Button } from "@ledgerhq/lumen-ui-react";
import { APPROVED_STATES } from "@ledgerhq/live-common/braze/localEligibility";
import { useBraze } from "LLD/features/DynamicContent/components/BrazeProvider";
import type { ContentCardEligibilityEvaluation } from "LLD/features/DynamicContent/utils/filterEligibleContentCards";
import { LocationContentCard } from "~/types/dynamicContent";
import { useTranslation } from "react-i18next";

const FormRow = styled(Flex)`
  align-items: center;
  column-gap: 12px;
`;

const Label = styled(Text)`
  min-width: 120px;
`;

const FullWidthInput = styled(Input)`
  flex: 1;
  min-width: 630px;
`;

const cardId = (card: { id?: string | null }) =>
  typeof card.id === "string" && card.id.length > 0 ? card.id : "";

type InspectCardStatus =
  | { kind: "missing-id" }
  | { kind: "unevaluated" }
  | { kind: "blocked"; blockedBy: string; reason: string }
  | { kind: "eligible" };

const inspectCardStatus = (
  id: string,
  evaluation: ContentCardEligibilityEvaluation | undefined,
): InspectCardStatus => {
  if (!id) {
    return { kind: "missing-id" };
  }
  if (!evaluation) {
    return { kind: "unevaluated" };
  }
  if (evaluation.result.eligible === false) {
    return {
      kind: "blocked",
      blockedBy: evaluation.result.blockedBy,
      reason: evaluation.result.reason,
    };
  }
  return { kind: "eligible" };
};

export const EligibilityInspect: React.FC = () => {
  const { t } = useTranslation();
  const { lastFetchedCards, eligibilityEvaluations, eligibilityContext, injectDebugContentCard } =
    useBraze();
  const [title, setTitle] = useState("Debug eligibility card");
  const [location, setLocation] = useState<string>(LocationContentCard.Portfolio);
  const [requiredStates, setRequiredStates] = useState("hasStax");

  const evaluationById = useMemo(
    () => new Map(eligibilityEvaluations.map(evaluation => [evaluation.id, evaluation])),
    [eligibilityEvaluations],
  );
  const fetchedCount = lastFetchedCards?.length ?? 0;
  const blockedCount = eligibilityEvaluations.filter(
    evaluation => !evaluation.result.eligible,
  ).length;
  const eligibleCount = eligibilityEvaluations.filter(
    evaluation => evaluation.result.eligible,
  ).length;
  const unevaluatedCount = (lastFetchedCards ?? []).filter(card => {
    const id = cardId(card);
    return !id || !evaluationById.has(id);
  }).length;

  const handleInject = () => {
    injectDebugContentCard({
      extras: {
        title,
        location,
        ...(requiredStates.trim() ? { requiredStates: requiredStates.trim() } : {}),
      },
    });
  };

  return (
    <Flex flexDirection="column" rowGap={24}>
      <Flex flexDirection="column" rowGap={8}>
        <Text variant="h5">{t("settings.developer.brazeTools.modal.inspect.snapshot")}</Text>
        {APPROVED_STATES.map(state => (
          <Flex key={state} justifyContent="space-between">
            <Text variant="paragraph">{state}</Text>
            <Text
              variant="paragraph"
              color={eligibilityContext[state] ? "success.c70" : "error.c50"}
            >
              {eligibilityContext[state]
                ? t("settings.developer.brazeTools.modal.inspect.yes")
                : t("settings.developer.brazeTools.modal.inspect.no")}
            </Text>
          </Flex>
        ))}
      </Flex>

      <Flex flexDirection="column" rowGap={8}>
        <Text variant="h5">{t("settings.developer.brazeTools.modal.inspect.funnel")}</Text>
        <Text variant="paragraph">
          {t("settings.developer.brazeTools.modal.inspect.fetched", { count: fetchedCount })}
        </Text>
        <Text variant="paragraph">
          {t("settings.developer.brazeTools.modal.inspect.removedEligibility", {
            count: blockedCount,
          })}
        </Text>
        <Text variant="paragraph">
          {t("settings.developer.brazeTools.modal.inspect.eligible", { count: eligibleCount })}
        </Text>
        <Text variant="paragraph">
          {t("settings.developer.brazeTools.modal.inspect.unevaluated", {
            count: unevaluatedCount,
          })}
        </Text>
      </Flex>

      <Flex flexDirection="column" rowGap={12}>
        <Text variant="h5">{t("settings.developer.brazeTools.modal.inspect.injectTitle")}</Text>
        <FormRow>
          <Label>{t("settings.developer.brazeTools.modal.fields.title")}</Label>
          <FullWidthInput
            value={title}
            onChangeEvent={event => setTitle(event.target.value)}
            placeholder="Title"
          />
        </FormRow>
        <FormRow>
          <Label>{t("settings.developer.brazeTools.modal.inspect.location")}</Label>
          <FullWidthInput
            value={location}
            onChangeEvent={event => setLocation(event.target.value)}
            placeholder={LocationContentCard.Portfolio}
          />
        </FormRow>
        <FormRow>
          <Label>{t("settings.developer.brazeTools.modal.inspect.requiredStates")}</Label>
          <FullWidthInput
            value={requiredStates}
            onChangeEvent={event => setRequiredStates(event.target.value)}
            placeholder="hasStax"
          />
        </FormRow>
        <Button size="sm" appearance="accent" onClick={handleInject}>
          {t("settings.developer.brazeTools.modal.inspect.inject")}
        </Button>
      </Flex>

      <Flex flexDirection="column" rowGap={8}>
        <Text variant="h5">{t("settings.developer.brazeTools.modal.inspect.cards")}</Text>
        {fetchedCount === 0 ? (
          <Text variant="paragraph" color="neutral.c70">
            {t("settings.developer.brazeTools.modal.inspect.empty")}
          </Text>
        ) : (
          (lastFetchedCards ?? []).map((card, index) => {
            const id = cardId(card);
            const evaluation = id ? evaluationById.get(id) : undefined;
            const status = inspectCardStatus(id, evaluation);
            const extras = "extras" in card ? card.extras : undefined;
            const titleExtra =
              extras && typeof extras === "object" && "title" in extras
                ? String(extras.title ?? id)
                : id || t("settings.developer.brazeTools.modal.inspect.missingId");
            return (
              <Flex key={id || `missing-id-${index}`} flexDirection="column" rowGap={4}>
                <Text variant="paragraph">{titleExtra}</Text>
                <Text variant="small" color="neutral.c70">
                  id: {id || t("settings.developer.brazeTools.modal.inspect.none")}
                </Text>
                <Text variant="small" color="neutral.c70">
                  {t("settings.developer.brazeTools.modal.inspect.requiredStates")}:{" "}
                  {evaluation?.requiredStates.length
                    ? evaluation.requiredStates.join("; ")
                    : t("settings.developer.brazeTools.modal.inspect.none")}
                </Text>
                {status.kind === "blocked" ? (
                  <Text variant="small" color="error.c50">
                    {t("settings.developer.brazeTools.modal.inspect.blockedBy", {
                      blockedBy: status.blockedBy,
                      reason: status.reason,
                    })}
                  </Text>
                ) : status.kind === "eligible" ? (
                  <Text variant="small" color="success.c70">
                    {t("settings.developer.brazeTools.modal.inspect.eligibleStatus")}
                  </Text>
                ) : (
                  <Text variant="small" color="neutral.c70">
                    {t(
                      status.kind === "missing-id"
                        ? "settings.developer.brazeTools.modal.inspect.missingIdStatus"
                        : "settings.developer.brazeTools.modal.inspect.unevaluatedStatus",
                    )}
                  </Text>
                )}
              </Flex>
            );
          })
        )}
      </Flex>
    </Flex>
  );
};
