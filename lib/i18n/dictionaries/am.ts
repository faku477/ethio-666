/**
 * Amharic dictionary — the source of truth for the translation shape.
 * `Dictionary` in `lib/i18n/types.ts` is derived from this object, so every
 * other locale is compile-time checked against it.
 */
export const am = {
    site: {
        name: "ኢትዮ-ኢሉሚናንት(666) የመመዝገቢያ ማዕከል",
        shortName: "ምዝገባ",
        tagline: "የመስመር ላይ ምዝገባ እና የሰርተፊኬት አገልግሎት",
    },

    nav: {
        home: "መነሻ",
        register: "ይመዝገቡ",
        verify: "ሰርተፊኬት አረጋግጥ",
        status: "ሁኔታ ይመልከቱ",
        switchLanguage: "ቋንቋ ይምረጡ",
    },

    home: {
        // Year in Western digits, not Ethiopic numerals (፪ሺ፲፰), so it matches the
        // Gregorian dates printed elsewhere on the certificate.
        eventName: "የአባልነት ምዝገባ 2026",
        title: "ኢትዮ-ኢሉሚናንት(666) የመመዝገቢያ ማዕከል",
        description:
            "በዚህ ገጽ በኩል መረጃዎን በማስገባት በቀላሉ መመዝገብ ይችላሉ። ምዝገባዎ እንደተጠናቀቀ ልዩ የምዝገባ ቁጥር ያገኛሉ፤ የምዝገባ ክፍያውን ፈጽመው ማረጋገጫ ካላኩ እና አስተዳዳሪው ካጸደቀ በኋላ በQR ኮድ የሚረጋገጥ ሰርተፊኬትዎን ማውረድ ይችላሉ።",
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
                title: "ክፍያውን ይፈጽሙ",
                body: "የምዝገባ ክፍያውን ከፈጸሙ በኋላ ደረሰኝዎን ወይም የክፍያ ማጣቀሻ ቁጥርዎን ይላኩ።",
            },
            {
                title: "ሰርተፊኬትዎን ያውርዱ",
                body: "አስተዳዳሪው ክፍያዎን አረጋግጦ ምዝገባዎን ካጸደቀ በኋላ ሰርተፊኬትዎን በPDF ማውረድ ይችላሉ።",
            },
        ],
        securityTitle: "የመረጃዎ ደህንነት",
        securityBody:
            "የባንክ ሂሳብ ቁጥርዎ በሰርተፊኬቱ ላይም ሆነ በሕዝባዊ የማረጋገጫ ገጽ ላይ በፍጹም አይታይም። የመታወቂያ ቁጥርዎ የሚታየው እርስዎ በሚያወርዱት ሰርተፊኬት ላይ ብቻ ሲሆን፣ በሕዝባዊ የማረጋገጫ ገጽ ላይ አይታይም። መረጃዎ በተጠበቀ ግንኙነት ብቻ ይተላለፋል።",
    },

    register: {
        title: "ኢትዮ-ኢሉሚናንት(666) የመመዝገቢያ ማዕከል",
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
            hint: "የፓስፖርት መጠን (35 x 45 ሚሜ) ወይም ባለአራት ማዕዘን 4 x 4 ፎቶ። JPG፣ PNG ወይም WebP፤ ቢያንስ 300 x 300 ፒክሰል፣ ከ4 ሜባ መብለጥ የለበትም።",
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
            photoTooLarge: "ፎቶው ከ4 ሜባ በላይ ነው።",
      photoTooSmallPixels:
        "ፎቶው ለህትመት በጣም ትንሽ ነው። ቢያንስ 300 x 300 ፒክሰል መሆን አለበት።",
      photoTooManyPixels: "የፎቶው ፒክሰል ብዛት በጣም ከፍተኛ ነው። ያነሰ ፎቶ ይጠቀሙ።",
      photoAspect:
        "ፎቶው የፓስፖርት መጠን (35 x 45 ሚሜ) ወይም ባለአራት ማዕዘን 4 x 4 መሆን አለበት። ፎቶውን ወደዚህ መጠን ቆርጠው እንደገና ይጫኑ።",
      photoUnreadable:
        "ይህ ፎቶ ማንበብ አልተቻለም። በJPG ወይም በPNG አስቀምጠው እንደገና ይሞክሩ።",
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
        intro: "ምዝገባዎ በተሳካ ሁኔታ ደርሶናል። መረጃዎን ከዚህ በታች ያገኛሉ።",
        feeNotice:
            "ምዝገባዎ ከመጽደቁ እና ሰርተፊኬትዎን ከማውረድዎ በፊት የተጠየቀውን የምዝገባ ክፍያ መክፈል አለብዎት።",
        keepNumber: "የምዝገባ ቁጥርዎን ያስቀምጡ። በኋላ በመታወቂያ ቁጥርዎ የምዝገባዎን ሁኔታ ማየት ይችላሉ።",
        checkStatus: "የምዝገባ ሁኔታ ይመልከቱ",
    },

    payment: {
        infoTitle: "የክፍያ መረጃ",
        method: "የክፍያ ዘዴ",
        accountName: "የሂሳብ ስም",
        accountNumber: "የሂሳብ ቁጥር",
        address: "የክፍያ አድራሻ",
        amount: "የምዝገባ ክፍያ",
        instructions: "ተጨማሪ መመሪያ",
        notConfigured: "የክፍያ መረጃ እስካሁን አልታተመም። እባክዎ አስተዳዳሪውን ያግኙ።",

        submitTitle: "የክፍያ ማረጋገጫ ይላኩ",
        submitIntro:
            "ክፍያውን ከፈጸሙ በኋላ የክፍያ ደረሰኝዎን ይጫኑ ወይም የክፍያ ማጣቀሻ ቁጥርዎን ያስገቡ። አንዱን ወይም ሁለቱንም መላክ ይችላሉ።",
        referenceLabel: "የክፍያ ማጣቀሻ ቁጥር",
        referenceHint: "ከባንኩ ደረሰኝ ላይ ያለው የግብይት ቁጥር።",
        receiptLabel: "የክፍያ ደረሰኝ",
        receiptHint: "JPG፣ PNG፣ WebP ወይም PDF። ከ4 ሜባ መብለጥ የለበትም።",
        receiptSelected: "የተመረጠ ፋይል",
        receiptRemove: "ፋይል ያስወግዱ",
        submit: "የክፍያ መረጃ ላክ",
        submitting: "በመላክ ላይ...",

        submittedTitle: "የክፍያ መረጃዎ በተሳካ ሁኔታ ተልኳል።",
        submittedBody:
            "ክፍያዎ በአስተዳዳሪው በመመርመር ላይ ነው። ምዝገባዎ ከጸደቀ በኋላ ሰርተፊኬትዎን ማውረድ ይችላሉ።",
        submittedOn: "የተላከበት ቀን",
        reference: "የክፍያ ማጣቀሻ ቁጥር",
        receipt: "የክፍያ ደረሰኝ",
        noReceipt: "ደረሰኝ አልተጫነም",
        noReference: "ማጣቀሻ ቁጥር አልተገባም",
        viewReceipt: "ደረሰኙን ይመልከቱ",
        resubmit: "የክፍያ መረጃውን ያስተካክሉ",

        errors: {
            paymentProofRequired: "የክፍያ ማጣቀሻ ቁጥር ያስገቡ ወይም ደረሰኝ ይጫኑ።",
            referenceInvalid: "ትክክለኛ የክፍያ ማጣቀሻ ቁጥር ያስገቡ።",
            receiptType: "የሚፈቀዱት JPG፣ PNG፣ WebP እና PDF ፋይሎች ብቻ ናቸው።",
            receiptTooLarge: "ፋይሉ ከ4 ሜባ በላይ ነው።",
            notFound: "ምዝገባው አልተገኘም።",
            alreadyApproved: "ይህ ምዝገባ አስቀድሞ ጸድቋል፤ ተጨማሪ የክፍያ መረጃ አያስፈልግም።",
            locked: "ክፍያዎ ተረጋግጧል፤ ማስተካከል አይቻልም።",
            rateLimited: "ብዙ ሙከራዎች ተደርገዋል። እባክዎ ትንሽ ቆይተው ይሞክሩ።",
            uploadFailed: "ደረሰኙን መጫን አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
            badRequest: "የላኩት መረጃ ትክክል አይደለም።",
            serverError: "መላክ አልተሳካም። እባክዎ እንደገና ይሞክሩ።",
            networkError: "ከአገልጋዩ ጋር መገናኘት አልተቻለም። ግንኙነትዎን ያረጋግጡ።",
        },
    },

    status: {
        label: "የምዝገባ ሁኔታ",
        paymentLabel: "የክፍያ ሁኔታ",

        registration: {
            pendingPayment: "ክፍያ ይጠበቃል",
            paymentSubmitted: "ክፍያ ተልኳል",
            approved: "ጸድቋል",
            rejected: "ተቀባይነት አላገኘም",
        },

        payment: {
            none: "ክፍያ አልተላከም",
            submitted: "በመመርመር ላይ",
            verified: "ተረጋግጧል",
            rejected: "ተቀባይነት አላገኘም",
        },

        messages: {
            pendingPayment:
                "ምዝገባዎ ተሳክቷል። እባክዎ የምዝገባ ክፍያውን ፈጽመው ደረሰኝዎን ወይም የማጣቀሻ ቁጥርዎን ይላኩ።",
            paymentSubmitted: "የክፍያ መረጃዎ ተልኳል፤ በአስተዳዳሪው ማረጋገጫ በመጠባበቅ ላይ ነው።",
            approved: "እንኳን ደስ አለዎት! ምዝገባዎ ጸድቋል። አሁን ሰርተፊኬትዎን ማውረድ ይችላሉ።",
            rejected: "ምዝገባዎ ተቀባይነት አላገኘም። እባክዎ አስተዳዳሪውን ያግኙ።",
        },

        certificateLocked:
            "ምዝገባዎ እስካሁን አልጸደቀም። አስተዳዳሪው ክፍያዎን አረጋግጦ ምዝገባዎን ካጸደቀ በኋላ ሰርተፊኬትዎን ማውረድ ይችላሉ።",
        certificateReady: "ሰርተፊኬትዎ ለማውረድ ዝግጁ ነው።",
        rejectionReason: "ምክንያት",
    },

    lookup: {
        title: "የምዝገባ ሁኔታ ማጣራት",
        intro: "የምዝገባዎን ሁኔታ ለማየት እና ሰርተፊኬትዎን ለማውረድ የመታወቂያ ቁጥርዎን ያስገቡ።",
        field: "የመታወቂያ ቁጥር",
        submit: "ሁኔታ ይመልከቱ",
        searching: "በመፈለግ ላይ...",
        notFound: "በገቡት የመታወቂያ ቁጥር ምዝገባ አልተገኘም። እባክዎ ቁጥሩን አረጋግጠው እንደገና ይሞክሩ።",
        invalid: "ትክክለኛ የመታወቂያ ቁጥር ያስገቡ።",
        registeredOn: "የተመዘገቡበት ቀን",
    },

    admin: {
        title: "የአስተዳዳሪ ማዕከል",

        login: {
            title: "የአስተዳዳሪ መግቢያ",
            subtitle: "ይህ ገጽ ለተፈቀደላቸው አስተዳዳሪዎች ብቻ ነው።",
            email: "ኢሜይል",
            password: "የይለፍ ቃል",
            submit: "ግባ",
            submitting: "በመግባት ላይ...",
        },

        nav: {
            dashboard: "ዳሽቦርድ",
            settings: "የክፍያ መረጃ",
            password: "የይለፍ ቃል ይቀይሩ",
            logout: "ውጣ",
            signedInAs: "የገቡት እንደ",
        },

        mustChangePassword: "የመጀመሪያውን የይለፍ ቃል እየተጠቀሙ ነው። እባክዎ አሁን ይቀይሩት።",

        stats: {
            total: "ጠቅላላ ምዝገባዎች",
            pendingPayment: "ክፍያ የሚጠበቅ",
            paymentSubmitted: "ክፍያ የተላከ",
            approved: "የጸደቀ",
            rejected: "ተቀባይነት ያላገኘ",
        },

        filters: {
            title: "ማጣሪያ",
            search: "ስም፣ የመታወቂያ ቁጥር፣ ስልክ ወይም የምዝገባ ቁጥር",
            status: "የምዝገባ ሁኔታ",
            paymentStatus: "የክፍያ ሁኔታ",
            from: "ከቀን",
            to: "እስከ ቀን",
            all: "ሁሉም",
            apply: "አጣራ",
            reset: "አጽዳ",
            results: "ውጤቶች",
        },

        table: {
            registrationId: "የምዝገባ ቁጥር",
            fullName: "ሙሉ ስም",
            identificationId: "የመታወቂያ ቁጥር",
            phoneNumber: "ስልክ",
            email: "ኢሜይል",
            registeredAt: "የምዝገባ ቀን",
            status: "የምዝገባ ሁኔታ",
            paymentStatus: "የክፍያ ሁኔታ",
            reference: "የክፍያ ማጣቀሻ",
            receipt: "ደረሰኝ",
            actions: "እርምጃ",
            view: "ዝርዝር ይመልከቱ",
      delete: "ሰርዝ",
            empty: "ምንም ምዝገባ አልተገኘም።",
            yes: "አለ",
            no: "የለም",
            previous: "ቀዳሚ",
            next: "ቀጣይ",
            page: "ገጽ",
        },

        details: {
            title: "የምዝገባ ዝርዝር",
            back: "ወደ ዳሽቦርድ ተመለስ",
            personalSection: "የተመዝጋቢ መረጃ",
            paymentSection: "የክፍያ መረጃ",
            decisionSection: "ውሳኔ",
            photo: "ፎቶ",
            bankAccountNumber: "የባንክ ሂሳብ ቁጥር",
            approvedBy: "ያጸደቀው",
            approvedAt: "የጸደቀበት ቀን",
            rejectedAt: "ውድቅ የተደረገበት ቀን",
            verifiedBy: "ክፍያውን ያረጋገጠው",
            receiptPreviewAlt: "የተጫነው ደረሰኝ ቅድመ እይታ",
            openReceipt: "ደረሰኙን ክፈት",
            downloadReceipt: "ደረሰኝ አውርድ",
            approve: "ምዝገባውን አጽድቅ",
            reject: "ምዝገባውን ውድቅ አድርግ",
            approveConfirm: "ይህን ምዝገባ ማጽደቅ እንደሚፈልጉ እርግጠኛ ነዎት?",
            rejectConfirm: "ይህን ምዝገባ ውድቅ ማድረግ እንደሚፈልጉ እርግጠኛ ነዎት?",
            rejectReason: "ምክንያት (አማራጭ)",
            approved: "ምዝገባው በተሳካ ሁኔታ ጸድቋል።",
            rejected: "ምዝገባው ውድቅ ተደርጓል።",
            working: "በማከናወን ላይ...",
            cancel: "ተወው",
            confirm: "አረጋግጥ",
            noPayment: "ተመዝጋቢው እስካሁን የክፍያ መረጃ አልላከም።",
            certificatePreview: "ሰርተፊኬቱን ይመልከቱ",
      delete: "ምዝገባውን ሰርዝ",
      deleteConfirm:
        "ይህን ምዝገባ በቋሚነት መሰረዝ ይፈልጋሉ? ተመዝጋቢውን፣ ክፍያውን፣ የተጫነውን ፎቶና ደረሰኝ ያስወግዳል። ይህ እርምጃ መመለስ አይቻልም።",
      deleted: "ምዝገባው ተሰርዟል።",
        },

        settings: {
            title: "የክፍያ መረጃ ማስተካከያ",
            intro: "እዚህ የሚያስገቡት መረጃ ለተመዝጋቢዎች በምዝገባ ማጠናቀቂያ ገጽ ላይ ይታያል።",
            save: "አስቀምጥ",
            saving: "በማስቀመጥ ላይ...",
            saved: "የክፍያ መረጃ ተስተካክሏል።",
            amountHint: "ለምሳሌ፦ 500 ብር",
            instructionsHint: "ለተመዝጋቢዎች ተጨማሪ መመሪያ ካለ ያስገቡ።",
        },

        password: {
            title: "የይለፍ ቃል ይቀይሩ",
            current: "አሁን ያለው የይለፍ ቃል",
            new: "አዲስ የይለፍ ቃል",
            confirm: "አዲሱን የይለፍ ቃል ያረጋግጡ",
            hint: "ቢያንስ 12 ፊደላት መሆን አለበት።",
            submit: "የይለፍ ቃል ቀይር",
            saving: "በማስቀመጥ ላይ...",
            saved: "የይለፍ ቃልዎ ተቀይሯል።",
        },

        errors: {
            invalidCredentials: "ኢሜይሉ ወይም የይለፍ ቃሉ ትክክል አይደለም።",
            emailInvalid: "ትክክለኛ ኢሜይል ያስገቡ።",
            passwordRequired: "የይለፍ ቃል ያስገቡ።",
            passwordTooShort: "የይለፍ ቃሉ ቢያንስ 12 ፊደላት መሆን አለበት።",
            passwordTooLong: "የይለፍ ቃሉ በጣም ረጅም ነው።",
            passwordMismatch: "የይለፍ ቃሎቹ አይመሳሰሉም።",
            passwordUnchanged: "አዲሱ የይለፍ ቃል ከቀድሞው የተለየ መሆን አለበት።",
            required: "ይህ መስክ ግዴታ ነው።",
            tooLong: "የገባው ጽሑፍ በጣም ረጅም ነው።",
            unauthorized: "እባክዎ እንደገና ይግቡ።",
            forbidden: "ይህን እርምጃ ለመፈጸም ፈቃድ የለዎትም።",
            notFound: "ምዝገባው አልተገኘም።",
            invalidTransition: "ይህ ምዝገባ በዚህ ሁኔታ ላይ ይህን እርምጃ አይፈቅድም።",
            rateLimited: "ብዙ ሙከራዎች ተደርገዋል። እባክዎ ትንሽ ቆይተው ይሞክሩ።",
            deleteFailed: "ምዝገባውን መሰረዝ አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
      serverError: "እርምጃው አልተሳካም። እባክዎ እንደገና ይሞክሩ።",
            networkError: "ከአገልጋዩ ጋር መገናኘት አልተቻለም። ግንኙነትዎን ያረጋግጡ።",
        },
    },

    certificate: {
        title: "የምስክር ወረቀት",
        presentedTo: "ይህ የምስክር ወረቀት የተሰጠው ለ",
        statement:
            "ከዛሬ ቀን ጀምሮ የኢትዮ-ኢሉሚናንት(666) አባል ሥለሆኑ በድርጅቱ ሥም ይህ የምስክር ወረቀት ተሰጥተኋል። ሥለሆነም እርስወ ከዛሬ ጀምር ከድርጅቱ ለአባላት የሚሠጡትን ማንኛውንም ጥቅማ ጥቅምም ማግኘት እድችሉ ድርጅቱ ፈቃድ ሰቷል።",
        registrationId: "የምዝገባ ቁጥር",
        identificationId: "የመታወቂያ ቁጥር",
        certificateNumber: "የሰርተፊኬት ቁጥር",
        registeredOn: "የተመዘገቡበት ቀን",
        issuedOn: "የተሰጠበት ቀን",
        authorizedName: "ፕሮፌሰር አቤል አያሌው",
        verifyHint: "ትክክለኛነቱን ለማረጋገጥ ይህን QR ኮድ ይቃኙ",
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
