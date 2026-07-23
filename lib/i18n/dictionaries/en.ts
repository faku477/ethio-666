import type { Dictionary } from "../types";

export const en: Dictionary = {
    site: {
        name: "Ethio-Illuminati (666) Registration Centre",
        shortName: "Registration",
        tagline: "Online registration and certificate service",
    },

    nav: {
        home: "Home",
        register: "Register",
        verify: "Verify certificate",
        status: "Check status",
        switchLanguage: "Choose language",
    },

    home: {
        eventName: "Membership Registration 2026",
        title: "Ethio-Illuminati (666) Registration Centre",
        description:
            "Register in minutes by submitting your details on this page. As soon as your registration is complete you receive a unique registration number. Once you have paid the registration fee and an administrator has approved your registration, you can download a certificate that anyone can verify through its QR code.",
        ctaPrimary: "Register",
        stepsTitle: "How does registration work?",
        steps: [
            {
                title: "Fill in your details",
                body: "Provide your full name, identification number, phone number and bank account number.",
            },
            {
                title: "Upload your photo",
                body: "Upload a clear passport-sized photo. You can preview and replace it before submitting.",
            },
            {
                title: "Pay the registration fee",
                body: "After paying, submit your payment receipt or your payment reference number for verification.",
            },
            {
                title: "Download your certificate",
                body: "Once an administrator has verified your payment and approved your registration, you can download your certificate as a PDF.",
            },
        ],
        securityTitle: "Your data is protected",
        securityBody:
            "Your bank account number never appears on the certificate or on the public verification page. Your identification number appears only on the certificate you download yourself, never on the public verification page. Your data is transmitted over a secure connection only.",
    },

    register: {
        title: "Ethio-Illuminati (666) Registration Centre",
        subtitle: "Fields marked with * are required.",
        fields: {
            fullName: "Full name",
            identificationId: "Identification number",
            phoneNumber: "Phone number",
            bankAccountNumber: "Bank account number",
            email: "Email",
            photo: "Photo",
        },
        optional: "optional",
        submit: "Register",
        submitting: "Submitting...",

        hints: {
            phoneNumber: "For example: 0912345678 or +251912345678",
            bankAccountNumber:
                "Your bank account number never appears on the certificate or on any public page.",
        },

        photo: {
            choose: "Choose photo",
            replace: "Replace photo",
            remove: "Remove photo",
            hint: "Passport photo (35 x 45 mm) or a square 4 x 4. JPG, PNG or WebP, at least 300 x 300 pixels, maximum 4 MB.",
            previewAlt: "Preview of the selected photo",
        },

        errors: {
            fullNameTooShort: "Full name must be at least 3 characters.",
            fullNameTooLong: "Full name is too long.",
            identificationIdInvalid: "Enter a valid identification number.",
            identificationIdTaken:
                "This identification number is already registered.",
            phoneNumberRequired: "Enter a phone number.",
            phoneNumberInvalid: "Enter a valid Ethiopian phone number.",
            phoneNumberTaken: "This phone number is already registered.",
            bankAccountNumberInvalid: "Enter a valid bank account number.",
            emailInvalid: "Enter a valid email address.",
            photoRequired: "Upload a photo.",
            photoType: "Only JPG, PNG and WebP images are allowed.",
            photoTooLarge: "The photo is larger than 4 MB.",
            photoTooSmallPixels:
                "The photo is too small to print. It must be at least 300 x 300 pixels.",
            photoTooManyPixels: "The photo has too many pixels. Use a smaller image.",
            photoAspect:
                "The photo must be a passport photo (35 x 45 mm) or a square 4 x 4. Crop it to that shape and upload it again.",
            photoUnreadable:
                "This image could not be read. Save it as a JPG or PNG and try again.",
            rateLimited:
                "Too many attempts. Please wait a moment and try again.",
            badRequest: "The submitted data is not valid.",
            duplicate: "This registration already exists.",
            uploadFailed: "The photo could not be uploaded. Please try again.",
            serverError: "Registration failed. Please try again.",
            networkError: "Could not reach the server. Check your connection.",
        },
    },

    success: {
        title: "Registration successful!",
        registrationId: "Registration number",
        certificateNumber: "Certificate number",
        download: "Download certificate",
        intro: "Your registration has been successfully submitted. Your details are below.",
        feeNotice:
            "You must pay the required registration fee before your registration can be approved and your certificate downloaded.",
        keepNumber:
            "Keep your registration number. You can check your registration status later using your identification number.",
        checkStatus: "Check registration status",
    },

    payment: {
        infoTitle: "Payment information",
        method: "Payment method",
        accountName: "Account name",
        accountNumber: "Account number",
        address: "Payment address",
        amount: "Registration fee",
        instructions: "Additional instructions",
        notConfigured:
            "Payment details have not been published yet. Please contact the administrator.",

        submitTitle: "Submit proof of payment",
        submitIntro:
            "After completing the payment, attach your payment receipt or enter your payment reference number. You may submit either one, or both.",
        referenceLabel: "Payment reference number",
        referenceHint: "The transaction number printed on your bank receipt.",
        receiptLabel: "Payment receipt",
        receiptHint: "JPG, PNG, WebP or PDF. Maximum 4 MB.",
        receiptSelected: "Selected file",
        receiptRemove: "Remove file",
        submit: "Submit payment information",
        submitting: "Submitting...",

        submittedTitle: "Payment information submitted successfully.",
        submittedBody:
            "Your payment is currently being reviewed by the administrator. You will be able to download your certificate after your registration has been approved.",
        submittedOn: "Submitted on",
        reference: "Payment reference number",
        receipt: "Payment receipt",
        noReceipt: "No receipt uploaded",
        noReference: "No reference number provided",
        viewReceipt: "View receipt",
        resubmit: "Correct the submitted payment information",

        errors: {
            paymentProofRequired:
                "Enter a payment reference number or upload a receipt.",
            referenceInvalid: "Enter a valid payment reference number.",
            receiptType: "Only JPG, PNG, WebP and PDF files are allowed.",
            receiptTooLarge: "The file is larger than 4 MB.",
            notFound: "Registration not found.",
            alreadyApproved:
                "This registration has already been approved; no further payment information is needed.",
            locked: "Your payment has been verified and can no longer be changed.",
            rateLimited:
                "Too many attempts. Please wait a moment and try again.",
            uploadFailed:
                "The receipt could not be uploaded. Please try again.",
            badRequest: "The submitted data is not valid.",
            serverError: "Submission failed. Please try again.",
            networkError: "Could not reach the server. Check your connection.",
        },
    },

    status: {
        label: "Registration status",
        paymentLabel: "Payment status",

        registration: {
            pendingPayment: "Pending payment",
            paymentSubmitted: "Payment submitted",
            approved: "Approved",
            rejected: "Rejected",
        },

        payment: {
            none: "No payment submitted",
            submitted: "Under review",
            verified: "Verified",
            rejected: "Rejected",
        },

        messages: {
            pendingPayment:
                "Your registration is successful. Please complete the registration fee payment and submit your payment receipt or reference number.",
            paymentSubmitted:
                "Your payment information has been submitted and is waiting for administrator verification.",
            approved:
                "Congratulations! Your registration has been approved. You can now download your certificate.",
            rejected:
                "Your registration was not approved. Please contact the administrator.",
        },

        certificateLocked:
            "Your registration has not yet been approved. You will be able to download your certificate after the administrator verifies your payment and approves your registration.",
        certificateReady: "Your certificate is now ready for download.",
        rejectionReason: "Reason",
    },

    lookup: {
        title: "Check your registration",
        intro: "Enter your identification number to check your registration status and download your certificate.",
        field: "Identification number",
        submit: "Check status",
        searching: "Searching...",
        notFound:
            "No registration was found for the provided ID number. Please check your ID number and try again.",
        invalid: "Enter a valid identification number.",
        registeredOn: "Registered on",
    },

    admin: {
        title: "Administration",

        login: {
            title: "Administrator login",
            subtitle: "This page is for authorized administrators only.",
            email: "Email",
            password: "Password",
            submit: "Log in",
            submitting: "Logging in...",
        },

        nav: {
            dashboard: "Dashboard",
            settings: "Payment information",
            password: "Change password",
            logout: "Log out",
            signedInAs: "Signed in as",
        },

        mustChangePassword:
            "You are still using the initial password. Please change it now.",

        stats: {
            total: "Total registrations",
            pendingPayment: "Pending payment",
            paymentSubmitted: "Payment submitted",
            approved: "Approved",
            rejected: "Rejected",
        },

        filters: {
            title: "Filters",
            search: "Name, ID number, phone or registration number",
            status: "Registration status",
            paymentStatus: "Payment status",
            from: "From date",
            to: "To date",
            all: "All",
            apply: "Apply",
            reset: "Reset",
            results: "results",
        },

        table: {
            registrationId: "Registration ID",
            fullName: "Full name",
            identificationId: "ID number",
            phoneNumber: "Phone",
            email: "Email",
            registeredAt: "Registration date",
            status: "Registration status",
            paymentStatus: "Payment status",
            reference: "Payment reference",
            receipt: "Receipt",
            actions: "Action",
            view: "View details",
            delete: "Delete",
            empty: "No registrations found.",
            yes: "Yes",
            no: "No",
            previous: "Previous",
            next: "Next",
            page: "Page",
        },

        details: {
            title: "Registration details",
            back: "Back to dashboard",
            personalSection: "Registrant information",
            paymentSection: "Payment information",
            decisionSection: "Decision",
            photo: "Photo",
            bankAccountNumber: "Bank account number",
            approvedBy: "Approved by",
            approvedAt: "Approved on",
            rejectedAt: "Rejected on",
            verifiedBy: "Payment verified by",
            receiptPreviewAlt: "Preview of the uploaded receipt",
            openReceipt: "Open receipt",
            downloadReceipt: "Download receipt",
            approve: "Approve registration",
            reject: "Reject registration",
            approveConfirm:
                "Are you sure you want to approve this registration?",
            rejectConfirm: "Are you sure you want to reject this registration?",
            rejectReason: "Reason (optional)",
            approved: "Registration approved successfully.",
            rejected: "Registration rejected.",
            working: "Working...",
            cancel: "Cancel",
            confirm: "Confirm",
            noPayment:
                "The registrant has not submitted any payment information yet.",
            certificatePreview: "View certificate",
            delete: "Delete registration",
            deleteConfirm:
                "Delete this registration permanently? This removes the registrant, their payment, and the uploaded photo and receipt. This cannot be undone.",
            deleted: "Registration deleted.",
        },

        settings: {
            title: "Payment information settings",
            intro: "What you enter here is shown to registrants on the registration success page.",
            save: "Save",
            saving: "Saving...",
            saved: "Payment information updated.",
            amountHint: "For example: 500 ETB",
            instructionsHint: "Any extra guidance for registrants.",
        },

        password: {
            title: "Change password",
            current: "Current password",
            new: "New password",
            confirm: "Confirm new password",
            hint: "At least 12 characters.",
            submit: "Change password",
            saving: "Saving...",
            saved: "Your password has been changed.",
        },

        errors: {
            invalidCredentials: "The email or password is incorrect.",
            emailInvalid: "Enter a valid email address.",
            passwordRequired: "Enter your password.",
            passwordTooShort: "The password must be at least 12 characters.",
            passwordTooLong: "The password is too long.",
            passwordMismatch: "The passwords do not match.",
            passwordUnchanged:
                "The new password must differ from the current one.",
            required: "This field is required.",
            tooLong: "This value is too long.",
            unauthorized: "Please log in again.",
            forbidden: "You are not allowed to perform this action.",
            notFound: "Registration not found.",
            invalidTransition:
                "This registration cannot take that action in its current state.",
            rateLimited:
                "Too many attempts. Please wait a moment and try again.",
            deleteFailed: "The registration could not be deleted. Please try again.",
            serverError: "The action failed. Please try again.",
            networkError: "Could not reach the server. Check your connection.",
        },
    },

    certificate: {
        title: "Certificate",
        presentedTo: "This is to certify that",
        statement:
            "From today you are a member of Ethio-Illuminati (666), and this certificate is issued to you in the name of the organization. From today the organization also permits you to receive any benefit granted to its members.",
        registrationId: "Registration Number",
        identificationId: "Identification Number",
        certificateNumber: "Certificate Number",
        registeredOn: "Registration Date",
        issuedOn: "Date of Issue",
                authorizedName: "Prof. Abel Ayalew",
        verifyHint: "Scan this QR code to verify authenticity",
    },

    verify: {
        title: "Certificate Verification",
        valid: "Valid certificate",
        notFound: "This certificate was not found.",
        name: "Name",
        registrationId: "Registration number",
        certificateNumber: "Certificate number",
        issuedOn: "Issued on",
    },

    common: {
        backHome: "Back to home",
        loading: "Loading...",
        notFoundTitle: "Page not found.",
        notFoundBody: "The page you requested does not exist or has moved.",
        errorTitle: "Something went wrong.",
        errorBody:
            "Please try again. If the problem persists, contact an administrator.",
        retry: "Try again",
    },

    footer: {
        rights: "All rights reserved.",
        verifyPrompt:
            "To verify a certificate, scan the QR code printed on it.",
    },
};
