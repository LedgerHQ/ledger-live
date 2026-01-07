import React from "react";
import { DRAWER_ENTRIES } from "./registry";

type GlobalDrawersProps = Readonly<{
  children: React.JSX.Element;
}>;

/**
 * GlobalDrawers — Centralized manager for **truly global drawers** across the app.
 *
 * ## 🚨 When to Use
 * Use **GlobalDrawers** only when a drawer must be accessible from multiple
 * unrelated pages or screens, and **cannot** reasonably be encapsulated within
 * a reusable component.
 *
 * Typical valid use cases include:
 * - Drawers triggered from multiple contexts (e.g. notifications, menus, shortcuts)
 * - System-level drawers that must be opened programmatically from anywhere
 * - Complex, multi-screen flows that require shared drawer state
 *
 * ## ✅ Prefer Local or Encapsulated Drawers
 * If your drawer is only used within a specific feature or page, or if you can
 * bundle the trigger and drawer together, **create a self-contained component instead**.
 *
 * Example:
 * ```tsx
 * // ❌ Bad: Global drawer + custom hook just for adding an account
 * openGlobalDrawer('addAccount');
 *
 * // ✅ Good: Localized component encapsulating its own drawer logic
 * <AddAccountButton />
 * ```
 *
 * Keeping drawers local whenever possible reduces coupling, simplifies state
 * management, and improves maintainability.
 */

function GlobalDrawers({ children }: GlobalDrawersProps) {
  return (
    <>
      {children}
      {DRAWER_ENTRIES.map(({ key, component: DrawerWrapper }) => (
        <DrawerWrapper key={key} />
      ))}
    </>
  );
}

export default GlobalDrawers;
