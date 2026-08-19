import spanish from "@/translations/es.json";
import valencian from "@/translations/val.json";

export const i18nResources = {
  val: { translation: valencian },
  es: { translation: spanish },
} as const;

export const i18nResourceVersion = JSON.stringify(i18nResources);
