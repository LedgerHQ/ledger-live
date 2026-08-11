// @ts-expect-error -- Metro resolves the bundled image to a native asset identifier at runtime.
import contactsFeatureIntroHero from "./assets/contacts-feature-intro-hero.webp";

export const CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE = contactsFeatureIntroHero as number;
