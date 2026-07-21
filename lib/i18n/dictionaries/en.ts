import type { Dictionary } from "../types";

export const en: Dictionary = {
  site: {
    name: "Participant Registration System",
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
    eventName: "National Training Programme 2026",
    title: "Participant Registration",
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
    title: "Participant Registration",
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
    preparing: "The form is being prepared.",
  },

  success: {
    title: "Your registration completed successfully!",
    registrationId: "Registration number",
    certificateNumber: "Certificate number",
    download: "Download certificate",
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
