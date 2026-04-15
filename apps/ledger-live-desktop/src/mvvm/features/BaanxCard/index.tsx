import React from "react";
import { BaanxCardView } from "./BaanxCardView";
import { useBaanxCardViewModel } from "./useBaanxCardViewModel";

const BaanxCard = () => <BaanxCardView {...useBaanxCardViewModel()} />;

export default BaanxCard;
