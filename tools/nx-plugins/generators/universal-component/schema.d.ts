export interface UniversalComponentGeneratorSchema {
  name: string;
  project: string;
  directory?: string;
  platformEntry?: "web" | "native";
}
