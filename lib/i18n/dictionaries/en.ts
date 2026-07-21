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
    switchLanguage: "Choose language",
  },

  home: {
    eventName: "Membership Registration 2026",
    title: "Ethio-Illuminati (666) Registration Centre",
    description:
      "Register in minutes by submitting your details on this page. As soon as your registration is complete you receive a unique registration number and a certificate that can be verified through its QR code.",
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
        title: "Download your certificate",
        body: "Once registration completes you receive your registration number and can download your certificate as a PDF.",
      },
    ],
    securityTitle: "Your data is protected",
    securityBody:
      "Your bank account number and identification number never appear on the certificate or on the public verification page. Your data is transmitted over a secure connection only.",
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
      hint: "JPG, PNG or WebP. Maximum 5 MB.",
      previewAlt: "Preview of the selected photo",
    },

    errors: {
      fullNameTooShort: "Full name must be at least 3 characters.",
      fullNameTooLong: "Full name is too long.",
      identificationIdInvalid: "Enter a valid identification number.",
      identificationIdTaken: "This identification number is already registered.",
      phoneNumberRequired: "Enter a phone number.",
      phoneNumberInvalid: "Enter a valid Ethiopian phone number.",
      phoneNumberTaken: "This phone number is already registered.",
      bankAccountNumberInvalid: "Enter a valid bank account number.",
      emailInvalid: "Enter a valid email address.",
      photoRequired: "Upload a photo.",
      photoType: "Only JPG, PNG and WebP images are allowed.",
      photoTooLarge: "The photo is larger than 5 MB.",
      rateLimited: "Too many attempts. Please wait a moment and try again.",
      badRequest: "The submitted data is not valid.",
      duplicate: "This registration already exists.",
      uploadFailed: "The photo could not be uploaded. Please try again.",
      serverError: "Registration failed. Please try again.",
      networkError: "Could not reach the server. Check your connection.",
    },
  },

  success: {
    title: "Your registration completed successfully!",
    registrationId: "Registration number",
    certificateNumber: "Certificate number",
    download: "Download certificate",
  },

  certificate: {
    title: "Certificate",
    presentedTo: "This is to certify that",
    statement: "has successfully registered for",
    registrationId: "Registration Number",
    certificateNumber: "Certificate Number",
    issuedOn: "Date of Issue",
    authorizedBy: "Authorized By",
    authorizedName: "Dr. Robel Alemu Mesheha",
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
    errorBody: "Please try again. If the problem persists, contact an administrator.",
    retry: "Try again",
  },

  footer: {
    rights: "All rights reserved.",
    verifyPrompt: "To verify a certificate, scan the QR code printed on it.",
  },
};
