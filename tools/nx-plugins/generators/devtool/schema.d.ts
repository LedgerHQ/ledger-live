export interface devtoolGeneratorSchema {
  name: string;
  label: string;
  owner: string;
  category:
    | "CONFIGURATION"
    | "FEATURES_AND_FLOWS"
    | "DEBUGGING"
    | "CONNECTIVITY"
    | "INFORMATION"
    | "PERFORMANCE"
    | "PLAYGROUND"
    | "GENERATORS";
  description?: string;
  platform: "both" | "web" | "native";
  hasProps: boolean;
}
