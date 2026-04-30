import { Category } from "../../types";
import { CATEGORY_ICONS } from "../../categoryConfig";

interface IconSquareProps {
  category: Category;
  variant?: "default" | "inverted";
}

export function IconSquare({ category, variant = "default" }: IconSquareProps) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <div
      className={`w-36 h-36 rounded-sm shrink-0 flex items-center justify-center ${
        variant === "inverted"
          ? "bg-interactive text-on-interactive"
          : "bg-canvas border border-muted text-base"
      }`}
    >
      <Icon size={20} />
    </div>
  );
}
