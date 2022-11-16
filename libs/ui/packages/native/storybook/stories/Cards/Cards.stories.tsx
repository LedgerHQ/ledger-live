import { storiesOf } from "../storiesOf";
import React from "react";
import CardA from "../../../src/components/Cards/CardA";
import CardB from "../../../src/components/Cards/CardB";

const CardAStory = () => <CardA></CardA>;

const CardBStory = () => <CardB></CardB>;

storiesOf((story) => story("Cards", module).add("Card A", CardAStory).add("Card B", CardBStory));
