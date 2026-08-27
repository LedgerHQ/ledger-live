import React, { useReducer } from "react";

import { Input, Text } from "@ledgerhq/react-ui";
import { Button } from "@ledgerhq/lumen-ui-react";
import ContentCardsLocation from "LLD/features/DynamicContent/components/ContentCardsLocation";
import { ALWAYS_ON_CATEGORY_ID } from "LLD/features/DynamicContent/utils/constants";
import { LocationContentCard } from "~/types/dynamicContent";
import {
  buildDefaultHardwareCarouselValues,
  buildRandomLedgerImageUrl,
  type HardwareCarouselBuilderValues,
} from "../hardwareCarouselDebug";
import { useGenerateLocalBraze } from "../Hooks/useGenerateLocalBraze";

type FormAction =
  | { type: "SET_FIELD"; field: keyof HardwareCarouselBuilderValues; value: string }
  | { type: "RESET"; values: HardwareCarouselBuilderValues };

function formReducer(state: HardwareCarouselBuilderValues, action: FormAction) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return action.values;
    default:
      return state;
  }
}

export function HardwareCarouselBuilder() {
  const [formData, dispatch] = useReducer(
    formReducer,
    undefined,
    buildDefaultHardwareCarouselValues,
  );
  const { addLocalHardwareCarouselCard, seedHardwareCarouselSample, dismissLocalCards } =
    useGenerateLocalBraze();

  const handleInputChange =
    (field: keyof HardwareCarouselBuilderValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: "SET_FIELD", field, value: event.target.value });
    };

  const handleCreateCard = () => {
    addLocalHardwareCarouselCard(formData);
    dispatch({
      type: "RESET",
      values: {
        ...buildDefaultHardwareCarouselValues(),
        categoryTitle: formData.categoryTitle,
        categoryCta: formData.categoryCta,
        categoryLink: formData.categoryLink,
        productTitle: formData.productTitle,
        subDescription: formData.subDescription,
        tag: formData.tag,
        order: String(Number(formData.order) + 1),
      },
    });
  };

  const handleLoadPreset = () => {
    dispatch({ type: "RESET", values: buildDefaultHardwareCarouselValues() });
  };

  const handleRandomMedia = () => {
    dispatch({ type: "SET_FIELD", field: "mediaUrl", value: buildRandomLedgerImageUrl() });
  };

  return (
    <div className="flex flex-col gap-16">
      <Text variant="paragraph" color="neutral.c70">
        Same workflow as mobile Content Cards QA: one small_square child card at a time under the
        shared <code>{ALWAYS_ON_CATEGORY_ID}</code> category.
      </Text>

      <Text variant="small" fontWeight="semiBold" className="mt-8">
        Container (section header — empty = cards only)
      </Text>
      <div className="flex items-center gap-12">
        <Text className="min-w-[160px]">Container title</Text>
        <div className="min-w-[480px] flex-1">
          <Input
            value={formData.categoryTitle}
            onChangeEvent={handleInputChange("categoryTitle")}
            placeholder='e.g. "Touchscreen offers"'
          />
        </div>
      </div>
      <div className="flex items-center gap-12">
        <Text className="min-w-[160px]">Container CTA</Text>
        <div className="min-w-[480px] flex-1">
          <Input
            value={formData.categoryCta}
            onChangeEvent={handleInputChange("categoryCta")}
            placeholder="Optional header CTA"
          />
        </div>
      </div>
      <div className="flex items-center gap-12">
        <Text className="min-w-[160px]">Container link</Text>
        <div className="min-w-[480px] flex-1">
          <Input
            value={formData.categoryLink}
            onChangeEvent={handleInputChange("categoryLink")}
            placeholder="Used when container CTA is set"
          />
        </div>
      </div>

      <Text variant="small" fontWeight="semiBold" className="mt-8">
        Card
      </Text>
      <div className="flex items-center gap-12">
        <Text className="min-w-[160px]">Product title</Text>
        <div className="min-w-[480px] flex-1">
          <Input
            value={formData.productTitle}
            onChangeEvent={handleInputChange("productTitle")}
            placeholder="e.g. Nano Pod"
          />
        </div>
      </div>
      <div className="flex items-center gap-12">
        <Text className="min-w-[160px]">Price (subDescription)</Text>
        <div className="min-w-[480px] flex-1">
          <Input
            value={formData.subDescription}
            onChangeEvent={handleInputChange("subDescription")}
            placeholder='e.g. "$50"'
          />
        </div>
      </div>
      <div className="flex items-center gap-12">
        <Text className="min-w-[160px]">Tag</Text>
        <div className="min-w-[480px] flex-1">
          <Input
            value={formData.tag}
            onChangeEvent={handleInputChange("tag")}
            placeholder='e.g. "30% off"'
          />
        </div>
      </div>
      <div className="flex items-center gap-12">
        <Text className="min-w-[160px]">Media URL</Text>
        <div className="min-w-[480px] flex-1">
          <Input
            value={formData.mediaUrl}
            onChangeEvent={handleInputChange("mediaUrl")}
            placeholder="Bundled device image (from ~/renderer/images/devices/)"
          />
        </div>
      </div>
      <div className="flex items-center gap-12">
        <Text className="min-w-[160px]">Link</Text>
        <div className="min-w-[480px] flex-1">
          <Input
            value={formData.link}
            onChangeEvent={handleInputChange("link")}
            placeholder="Optional product link"
          />
        </div>
      </div>
      <div className="flex items-center gap-12">
        <Text className="min-w-[160px]">Order</Text>
        <div className="min-w-[480px] flex-1">
          <Input
            value={formData.order}
            onChangeEvent={handleInputChange("order")}
            placeholder="0"
            type="number"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-12">
        <Button size="sm" appearance="accent" onClick={handleCreateCard}>
          Create card
        </Button>
        <Button size="sm" appearance="gray" onClick={handleLoadPreset}>
          Load mobile preset
        </Button>
        <Button size="sm" appearance="gray" onClick={handleRandomMedia}>
          Random media
        </Button>
        <Button size="sm" appearance="gray" onClick={seedHardwareCarouselSample}>
          Seed 3 sample cards
        </Button>
        <Button size="sm" appearance="red" onClick={dismissLocalCards}>
          Dismiss all local cards
        </Button>
      </div>

      <div className="flex flex-col gap-12 border-t border-neutral-c100/10 pt-8">
        <Text variant="large" fontWeight="semiBold">
          Live preview
        </Text>
        <ContentCardsLocation locationId={LocationContentCard.Portfolio} />
      </div>
    </div>
  );
}
