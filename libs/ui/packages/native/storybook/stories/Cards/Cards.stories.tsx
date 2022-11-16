import { text } from "@storybook/addon-knobs";
import { storiesOf } from "../storiesOf";
import { select, boolean } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import React from "react";
import CardA from "../../../src/components/Cards/CardA";
import CardB from "../../../src/components/Cards/CardB";
import { InfoMedium } from "@ledgerhq/icons-ui/native";

const CardAStory = () => <CardA></CardA>;

const CardBStory = () => <CardB></CardB>;

storiesOf((story) => story("Cards", module).add("Card A", CardAStory).add("Card B", CardBStory));
