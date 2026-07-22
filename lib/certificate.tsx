/* eslint-disable jsx-a11y/alt-text --
 * The <Image> here is @react-pdf/renderer's PDF drawing primitive, not an HTML
 * <img>. It has no `alt` prop, and PDF accessibility is expressed through
 * document structure instead. */
import path from "node:path";

import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import type { Dictionary } from "./i18n";

const FONT_DIR = path.join(process.cwd(), "public", "fonts");

/**
 * Ethiopic glyphs must be embedded explicitly.
 *
 * @react-pdf/renderer falls back to Helvetica, a WinAnsi font with no Ethiopic
 * coverage — Amharic text would render as blank boxes with no error raised.
 * These are real TTFs; the woff2 files `next/font` produces are not supported.
 */
Font.register({
  family: "NotoEthiopic",
  fonts: [
    { src: path.join(FONT_DIR, "NotoSansEthiopic-400.ttf"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "NotoSansEthiopic-700.ttf"), fontWeight: 700 },
  ],
});

// Amharic words must not be broken across lines by the Latin hyphenation rules.
Font.registerHyphenationCallback((word) => [word]);

export type CertificateData = {
  fullName: string;
  /**
   * Printed on the certificate itself, which is released only to the approved
   * holder over a private, no-store response. It is still withheld from the
   * public verification page and from every API response.
   */
  identificationId: string;
  registrationId: string;
  certificateNumber: string;
  /** Date the participant registered. */
  registeredOn: string;
  /** Date the certificate was issued — i.e. when an administrator approved it. */
  issuedOn: string;
  /** data: URI of the QR code pointing at the public verification URL. */
  qrCode: string;
  /** data: URI of the participant photo, when one could be loaded. */
  photo: string | null;
  /** data: URI of the organization stamp, when `public/stamp.png` exists. */
  stamp: string | null;
  /** data: URI of the full-page watermark drawn behind everything else. */
  background: string | null;
  /** data: URIs of the emblems flanking the stamp. Any length; missing files
   *  are simply absent, so the certificate still renders. */
  emblems: string[];
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoEthiopic",
    backgroundColor: "#ffffff",
    paddingVertical: 20,
    paddingHorizontal: 34,
  },
  /**
   * Full-bleed watermark.
   *
   * Absolutely positioned and declared before everything else so it paints
   * underneath: @react-pdf/renderer has no z-index, so paint order is document
   * order. Kept faint enough that black body text still reads over it.
   */
  watermark: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    opacity: 0.07,
  },
  frame: {
    flexGrow: 1,
    borderWidth: 2,
    borderColor: "#027a48",
    borderStyle: "solid",
    padding: 16,
  },
  inner: {
    flexGrow: 1,
    borderWidth: 0.75,
    borderColor: "#d4a017",
    borderStyle: "solid",
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerStamp: { width: 68, height: 68 },
  headerSpacer: { width: 68 },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: "#05603a",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: 13,
    color: "#5b6b62",
    textAlign: "center",
    marginTop: 4,
  },
  rule: {
    alignSelf: "center",
    width: 120,
    height: 2,
    backgroundColor: "#d4a017",
    marginTop: 6,
  },
  presentedTo: {
    fontSize: 13,
    color: "#5b6b62",
    textAlign: "center",
    marginTop: 8,
  },
  name: {
    fontSize: 30,
    fontWeight: 700,
    color: "#0d1b14",
    textAlign: "center",
    marginTop: 6,
  },
  nameRule: {
    alignSelf: "center",
    width: "62%",
    height: 0.75,
    backgroundColor: "#e3ebe6",
    marginTop: 6,
  },
  /** The membership declaration — the largest block of prose on the page, so
   *  it carries its own line height rather than the Latin default. */
  statement: {
    fontSize: 18,
    lineHeight: 1.6,
    color: "#116ed1",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 12,
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  photo: {
    width: 92,
    height: 92,
    objectFit: "cover",
    borderWidth: 0.75,
    borderColor: "#e3ebe6",
    borderStyle: "solid",
  },
  details: { flexGrow: 1, paddingHorizontal: 16, justifyContent: "center" },
  detailRow: { flexDirection: "row", marginBottom: 4 },
  detailLabel: { fontSize: 11, color: "#5b6b62", width: 124 },
  detailValue: { fontSize: 13, fontWeight: 700, color: "#0d1b14" },
  qrBlock: { alignItems: "center", width: 96 },
  qr: { width: 76, height: 76 },
  qrHint: {
    fontSize: 7,
    color: "#5b6b62",
    textAlign: "center",
    marginTop: 3,
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 2,
  },
  signature: { width: 250 },
  signatureName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0d1b14",
    marginTop: 4,
  },
  /** The seal, sitting directly above the authorizing name. */
  signatureStamp: {
    width: 76,
    height: 76,
    objectFit: "contain",
    alignSelf: "flex-start",
  },
  /** Emblems flanking the stamp, in the footer's free space. */
  emblemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 2,
  },
  emblem: { width: 54, height: 54, objectFit: "contain" },
  serial: { fontSize: 8, color: "#8a9a91", textAlign: "right", marginTop: 4 },
});

function CertificateDocument({
  data,
  dict,
}: {
  data: CertificateData;
  dict: Dictionary;
}) {
  const t = dict.certificate;

  return (
    <Document
      title={`${t.title} — ${data.registrationId}`}
      author={dict.site.name}
    >
      {/* A4 landscape prints cleanly on the paper size used in Ethiopia.
          `wrap={false}` guarantees a certificate is always exactly one page:
          without it, a long participant name or a locale with longer strings
          silently spills onto a second, near-empty page. */}
      <Page size="A4" orientation="landscape" style={styles.page} wrap={false}>
        {/* First child, so every later element paints on top of it. */}
        {data.background && (
          <Image src={data.background} style={styles.watermark} />
        )}

        <View style={styles.frame}>
          <View style={styles.inner}>
            <View style={styles.header}>
              {data.stamp ? (
                <Image src={data.stamp} style={styles.headerStamp} />
              ) : (
                <View style={styles.headerSpacer} />
              )}
              <View>
                <Text style={styles.title}>{t.title}</Text>
                <Text style={styles.eventName}>{dict.site.name}</Text>
              </View>
              {/* Balances the header so the title stays optically centred. */}
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.rule} />

            <Text style={styles.presentedTo}>{t.presentedTo}</Text>
            <Text style={styles.name}>{data.fullName}</Text>
            <View style={styles.nameRule} />

            <Text style={styles.statement}>{t.statement}</Text>

            <View style={styles.body}>
              {data.photo ? (
                <Image src={data.photo} style={styles.photo} />
              ) : (
                <View style={styles.photo} />
              )}

              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.registrationId}</Text>
                  <Text style={styles.detailValue}>{data.registrationId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.identificationId}</Text>
                  <Text style={styles.detailValue}>{data.identificationId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.certificateNumber}</Text>
                  <Text style={styles.detailValue}>
                    {data.certificateNumber}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.registeredOn}</Text>
                  <Text style={styles.detailValue}>{data.registeredOn}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.issuedOn}</Text>
                  <Text style={styles.detailValue}>{data.issuedOn}</Text>
                </View>
              </View>

              <View style={styles.qrBlock}>
                <Image src={data.qrCode} style={styles.qr} />
                <Text style={styles.qrHint}>{t.verifyHint}</Text>
              </View>
            </View>

            <View style={styles.footer}>
              {/* The seal, with the authorizing name printed beneath it. There
                  is no signature rule: nothing is signed by hand here, and an
                  empty line invites someone to think a signature is missing. */}
              <View style={styles.signature}>
                {data.stamp && (
                  <Image src={data.stamp} style={styles.signatureStamp} />
                )}
                <Text style={styles.signatureName}>{t.authorizedName}</Text>
              </View>

              {/* Emblems, flanking the stamp on the right of the footer. */}
              <View style={styles.emblemRow}>
                {data.emblems.map((emblem, index) => (
                  <Image
                    key={index}
                    src={emblem}
                    style={styles.emblem}
                  />
                ))}
              </View>
            </View>

            <Text style={styles.serial}>{data.certificateNumber}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderCertificatePdf(
  data: CertificateData,
  dict: Dictionary,
): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument data={data} dict={dict} />);
}
