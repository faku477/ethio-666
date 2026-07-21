import type { am } from "./dictionaries/am";

/**
 * The translation contract. Derived from the Amharic dictionary so that adding a
 * key to `am.ts` immediately turns every other locale file into a type error
 * until it is translated.
 */
export type Dictionary = typeof am;
