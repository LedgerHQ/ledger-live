const HEIGHT_EPSILON_PX = 1;

function readPx(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isSkippedBox(styles: CSSStyleDeclaration): boolean {
  return styles.display === "none" || styles.position === "absolute" || styles.position === "fixed";
}

function columnContentHeight(element: HTMLElement, styles: CSSStyleDeclaration): number {
  let childrenHeight = 0;
  let visibleChildren = 0;

  for (const child of element.children) {
    if (!(child instanceof HTMLElement)) continue;
    const childStyles = getComputedStyle(child);
    if (isSkippedBox(childStyles)) continue;
    visibleChildren += 1;
    childrenHeight += measureStackedHeight(child);
  }

  const gap = readPx(styles.rowGap) * Math.max(0, visibleChildren - 1);
  const padding = readPx(styles.paddingTop) + readPx(styles.paddingBottom);
  const border = readPx(styles.borderTopWidth) + readPx(styles.borderBottomWidth);

  return Math.max(childrenHeight + gap + padding + border, readPx(styles.minHeight));
}

/** Content height of a stacked dialog layout, ignoring boxes stretched by a max-height cap. */
export function measureStackedHeight(element: HTMLElement): number {
  const styles = getComputedStyle(element);
  if (isSkippedBox(styles)) return 0;

  const margin = readPx(styles.marginTop) + readPx(styles.marginBottom);
  const isColumn =
    styles.display === "flex" &&
    (styles.flexDirection === "column" || styles.flexDirection === "column-reverse");

  if (!isColumn || element.children.length === 0) {
    return element.offsetHeight + margin;
  }

  return columnContentHeight(element, styles) + margin;
}

/** Height available to a dialog child before it reaches the dialog's max-height. */
export function readAvailableHeight(outer: HTMLElement): number {
  const parent = outer.parentElement;
  if (!parent) return Number.POSITIVE_INFINITY;

  const styles = getComputedStyle(parent);
  const maxHeight = Number.parseFloat(styles.maxHeight);
  if (!Number.isFinite(maxHeight)) return Number.POSITIVE_INFINITY;

  const padding = readPx(styles.paddingTop) + readPx(styles.paddingBottom);
  const border = readPx(styles.borderTopWidth) + readPx(styles.borderBottomWidth);
  const contentMax = styles.boxSizing === "border-box" ? maxHeight - padding - border : maxHeight;

  let siblings = 0;
  for (const child of parent.children) {
    if (!(child instanceof HTMLElement) || child === outer) continue;
    const childStyles = getComputedStyle(child);
    if (isSkippedBox(childStyles)) continue;
    siblings += child.offsetHeight;
  }

  return Math.max(0, contentMax - siblings);
}

export function resolveAnimatedHeight(naturalHeight: number, availableHeight: number): number {
  if (!Number.isFinite(availableHeight)) return naturalHeight;
  return Math.min(naturalHeight, Math.max(0, availableHeight));
}

export function isAnimatedHeightCapped(naturalHeight: number, availableHeight: number): boolean {
  return Number.isFinite(availableHeight) && naturalHeight > availableHeight + HEIGHT_EPSILON_PX;
}
