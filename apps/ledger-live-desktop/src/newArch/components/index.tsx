/** This file acts as a proxy so we only have to update the imports in one place */
/** Every components are accessible using LLD/components for e.g import { LdlsButton } from "LLD/components" */

export { Button as LdlsButton } from "@ldls/ui-react";
/** ... other components from @ldls/ui-react */

export { default as GenericEmptyList } from "./GenericEmptyList";
/** ... other components from LLD */

export { Button as OldButton } from "@ledgerhq/react-ui";
/** ... other components from our design system */
