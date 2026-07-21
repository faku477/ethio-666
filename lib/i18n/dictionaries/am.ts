/**
 * Amharic dictionary — the source of truth for the translation shape.
 * `Dictionary` in `lib/i18n/types.ts` is derived from this object, so every
 * other locale is compile-time checked against it.
 */
export const am = {
  site: {
    name: "የተመዝጋቢ ምዝገባ ሥርዓት",
    shortName: "ምዝገባ",
    tagline: "የመስመር ላይ ምዝገባ እና የሰርተፊኬት አገልግሎት",
  },

  nav: {
    home: "መነሻ",
    register: "ይመዝገቡ",
    verify: "ሰርተፊኬት አረጋግጥ",
    switchLanguage: "ቋንቋ ይምረጡ",
  },

  home: {
    eventName: "ብሔራዊ የሥልጠና መርሃ ግብር ፪ሺ፲፰",
    title: "የተመዝጋቢ ምዝገባ",
    description:
      "በዚህ ገጽ በኩል መረጃዎን በማስገባት በቀላሉ መመዝገብ ይችላሉ። ምዝገባዎ እንደተጠናቀቀ ልዩ የምዝገባ ቁጥር እና በQR ኮድ የሚረጋገጥ ሰርተፊኬት ወዲያውኑ ያገኛሉ።",
    ctaPrimary: "ይመዝገቡ",
    stepsTitle: "ምዝገባው እንዴት ይከናወናል?",
    steps: [
      {
        title: "መረጃዎን ይሙሉ",
        body: "ሙሉ ስም፣ የመታወቂያ ቁጥር፣ የስልክ ቁጥር እና የባንክ ሂሳብ ቁጥርዎን ያስገቡ።",
      },
      {
        title: "ፎቶዎን ይጫኑ",
        body: "ግልጽ የሆነ የፓስፖርት መጠን ያለው ፎቶ ይጫኑ። ከመላክዎ በፊት ማየትና መቀየር ይችላሉ።",
      },
      {
        title: "ሰርተፊኬትዎን ያውርዱ",
        body: "ምዝገባዎ ሲጠናቀቅ የምዝገባ ቁጥርዎን ተቀብለው ሰርተፊኬትዎን በPDF ማውረድ ይችላሉ።",
      },
    ],
    securityTitle: "የመረጃዎ ደህንነት",
    securityBody:
      "የባንክ ሂሳብ ቁጥርዎ እና የመታወቂያ ቁጥርዎ በሰርተፊኬቱ ላይ ወይም በሕዝባዊ የማረጋገጫ ገጽ ላይ በፍጹም አይታዩም። መረጃዎ በተጠበቀ ግንኙነት ብቻ ይተላለፋል።",
  },

  register: {
    title: "የተመዝጋቢ ምዝገባ",
    subtitle: "በ * የተመለከቱት መስኮች ግዴታ ናቸው።",
    fields: {
      fullName: "ሙሉ ስም",
      identificationId: "የመታወቂያ ቁጥር",
      phoneNumber: "የስልክ ቁጥር",
      bankAccountNumber: "የባንክ ሂሳብ ቁጥር",
      email: "ኢሜይል",
      photo: "ፎቶ",
    },
    optional: "አማራጭ",
    submit: "ይመዝገቡ",
    submitting: "በመላክ ላይ...",

    hints: {
      phoneNumber: "ለምሳሌ፦ 0912345678 ወይም +251912345678",
      bankAccountNumber:
        "የባንክ ሂሳብ ቁጥርዎ በሰርተፊኬቱ ላይ ወይም በሕዝባዊ ገጽ ላይ አይታይም።",
    },

    photo: {
      choose: "ፎቶ ይምረጡ",
      replace: "ፎቶ ይቀይሩ",
      remove: "ፎቶ ያስወግዱ",
      hint: "JPG፣ PNG ወይም WebP። ከ5 ሜባ መብለጥ የለበትም።",
      previewAlt: "የተመረጠው ፎቶ ቅድመ እይታ",
    },

    errors: {
      fullNameTooShort: "ሙሉ ስም ቢያንስ 3 ፊደላት መሆን አለበት።",
      fullNameTooLong: "ሙሉ ስም በጣም ረጅም ነው።",
      identificationIdInvalid: "ትክክለኛ የመታወቂያ ቁጥር ያስገቡ።",
      identificationIdTaken: "ይህ የመታወቂያ ቁጥር አስቀድሞ ተመዝግቧል።",
      phoneNumberRequired: "የስልክ ቁጥር ያስገቡ።",
      phoneNumberInvalid: "ትክክለኛ የኢትዮጵያ የስልክ ቁጥር ያስገቡ።",
      phoneNumberTaken: "ይህ የስልክ ቁጥር አስቀድሞ ተመዝግቧል።",
      bankAccountNumberInvalid: "ትክክለኛ የባንክ ሂሳብ ቁጥር ያስገቡ።",
      emailInvalid: "ትክክለኛ ኢሜይል ያስገቡ።",
      photoRequired: "ፎቶ ይጫኑ።",
      photoType: "የሚፈቀዱት JPG፣ PNG እና WebP ፎቶዎች ብቻ ናቸው።",
      photoTooLarge: "ፎቶው ከ5 ሜባ በላይ ነው።",
      rateLimited: "ብዙ ሙከራዎች ተደርገዋል። እባክዎ ትንሽ ቆይተው ይሞክሩ።",
      badRequest: "የላኩት መረጃ ትክክል አይደለም።",
      duplicate: "ይህ ምዝገባ አስቀድሞ ተከናውኗል።",
      uploadFailed: "ፎቶውን መጫን አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
      serverError: "ምዝገባው አልተሳካም። እባክዎ እንደገና ይሞክሩ።",
      networkError: "ከአገልጋዩ ጋር መገናኘት አልተቻለም። ግንኙነትዎን ያረጋግጡ።",
    },
  },

  success: {
    title: "ምዝገባዎ በተሳካ ሁኔታ ተጠናቋል!",
    registrationId: "የምዝገባ ቁጥር",
    certificateNumber: "የሰርተፊኬት ቁጥር",
    download: "ሰርተፊኬት አውርድ",
  },

  verify: {
    title: "የሰርተፊኬት ማረጋገጫ",
    valid: "ትክክለኛ ሰርተፊኬት",
    notFound: "ይህ ሰርተፊኬት አልተገኘም።",
    name: "ስም",
    registrationId: "የምዝገባ ቁጥር",
    certificateNumber: "የሰርተፊኬት ቁጥር",
    issuedOn: "የተሰጠበት ቀን",
  },

  common: {
    backHome: "ወደ መነሻ ገጽ ተመለስ",
    loading: "በመጫን ላይ...",
    notFoundTitle: "ገጹ አልተገኘም።",
    notFoundBody: "የፈለጉት ገጽ የለም ወይም ተቀይሯል።",
    errorTitle: "ስህተት ተከስቷል።",
    errorBody: "እባክዎ እንደገና ይሞክሩ። ችግሩ ከቀጠለ አስተዳዳሪውን ያግኙ።",
    retry: "እንደገና ሞክር",
  },

  footer: {
    rights: "ሁሉም መብቶች የተጠበቁ ናቸው።",
    verifyPrompt: "የሰርተፊኬት ትክክለኛነት ለማረጋገጥ በሰርተፊኬቱ ላይ ያለውን QR ኮድ ይቃኙ።",
  },
};
// NOTE: deliberately no `as const`. Widening the values to `string` is what makes
// `Dictionary` a structural contract other locales can satisfy, rather than a set
// of Amharic string literals nothing else could ever match.
