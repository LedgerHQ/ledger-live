import { useState } from "react";
import { t } from "i18next";
import { Layout, LayoutKey } from "../types/Layouts";

const useMenuLayouts = () => {
  const layoutOptions: Record<LayoutKey, Layout> = {
    grid: {
      value: "grid",
      label: t("account.ordinals.layouts.grid"),
    },
    list: {
      value: "list",
      label: t("account.ordinals.layouts.list"),
    },
  };

  const [layout, setLayout] = useState<LayoutKey>("grid");

  const changeLayout = (layoutSelected: Layout) => {
    setLayout(layoutSelected.value);
  };

  return {
    layoutOptions,
    layout,
    changeLayout,
  };
};

export default useMenuLayouts;
