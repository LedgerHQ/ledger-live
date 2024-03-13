import { useState } from "react";
import { t } from "i18next";

const useMenuLayouts = () => {
  const layoutOptions = {
    grid: {
      value: "grid",
      label: t("account.ordinals.layouts.grid"),
    },
    list: {
      value: "list",
      label: t("account.ordinals.layouts.list"),
    },
  };

  const [layout, setLayout] = useState("grid");

  const changeLayout = (layoutSelected: any) => {
    setLayout(layoutSelected.value);
  };

  return {
    layoutOptions,
    layout,
    changeLayout,
  };
};

export default useMenuLayouts;
