import { storiesOf } from "../storiesOf";
import React from "react";
import Info from "@ui/assets/icons/InfoMedium";
import IconBox from "../../../src/components/Icon/IconBox";

const IconBoxSample = () => <IconBox Icon={Info} />;

storiesOf((story) => story("Icon", module).add("IconBox", IconBoxSample));
