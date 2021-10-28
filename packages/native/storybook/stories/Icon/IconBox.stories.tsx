import { storiesOf } from "../storiesOf";
import React from "react";
import { Icons } from "../../../src/assets";
import IconBox from "../../../src/components/Icon/IconBox";

const IconBoxSample = () => <IconBox Icon={Icons.InfoMedium} />;

storiesOf((story) => story("Icon", module).add("IconBox", IconBoxSample));
