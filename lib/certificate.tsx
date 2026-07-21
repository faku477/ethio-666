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
  registrationId: string;
  certificateNumber: string;
  issuedOn: string;
  eventName: string;
  /** data: URI of the QR code pointing at the public verification URL. */
  qrCode: string;
  /** data: URI of the participant photo, when one could be loaded. */
  photo: string | null;
  /** data: URI of the organization stamp, when `public/stamp.png` exists. */
  stamp: string | null;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoEthiopic",
    backgroundColor: "#ffffff",
    paddingVertical: 34,
    paddingHorizontal: 40,
  },
  frame: {
    flexGrow: 1,
    borderWidth: 2,
    borderColor: "#027a48",
    borderStyle: "solid",
    padding: 22,
  },
  inner: {
    flexGrow: 1,
    borderWidth: 0.75,
    borderColor: "#d4a017",
    borderStyle: "solid",
    paddingVertical: 22,
    paddingHorizontal: 26,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerStamp: { width: 62, height: 62 },
  headerSpacer: { width: 62 },
  title: {
    fontSize: 27,
    fontWeight: 700,
    color: "#05603a",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: 11,
    color: "#5b6b62",
    textAlign: "center",
    marginTop: 5,
  },
  rule: {
    alignSelf: "center",
    width: 108,
    height: 2,
    backgroundColor: "#d4a017",
    marginTop: 12,
  },
  presentedTo: {
    fontSize: 11,
    color: "#5b6b62",
    textAlign: "center",
    marginTop: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0d1b14",
    textAlign: "center",
    marginTop: 8,
  },
  nameRule: {
    alignSelf: "center",
    width: "62%",
    height: 0.75,
    backgroundColor: "#e3ebe6",
    marginTop: 10,
  },
  statement: {
    fontSize: 11,
    color: "#5b6b62",
    textAlign: "center",
    marginTop: 14,
  },
  program: {
    fontSize: 14,
    fontWeight: 700,
    color: "#027a48",
    textAlign: "center",
    marginTop: 6,
  },
  body: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },
  photo: {
    width: 78,
    height: 78,
    objectFit: "cover",
    borderWidth: 0.75,
    borderColor: "#e3ebe6",
    borderStyle: "solid",
  },
  details: { flexGrow: 1, paddingHorizontal: 18, justifyContent: "center" },
  detailRow: { flexDirection: "row", marginBottom: 6 },
  detailLabel: { fontSize: 9, color: "#5b6b62", width: 108 },
  detailValue: { fontSize: 11, fontWeight: 700, color: "#0d1b14" },
  qrBlock: { alignItems: "center", width: 92 },
  qr: { width: 76, height: 76 },
  qrHint: {
    fontSize: 6,
    color: "#5b6b62",
    textAlign: "center",
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 14,
  },
  signature: { width: 172 },
  signatureLine: { height: 0.75, backgroundColor: "#0d1b14" },
  signatureLabel: { fontSize: 9, color: "#5b6b62", marginTop: 5 },
  footerStamp: { width: 74, height: 74 },
  serial: { fontSize: 7, color: "#8a9a91" },
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
      {/* A4 landscape prints cleanly on the paper size used in Ethiopia. */}
      <Page size="A4" orientation="landscape" style={styles.page}>
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
            <Text style={styles.program}>{data.eventName}</Text>

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
                  <Text style={styles.detailLabel}>{t.certificateNumber}</Text>
                  <Text style={styles.detailValue}>
                    {data.certificateNumber}
                  </Text>
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
              <View style={styles.signature}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>{t.authorizedBy}</Text>
              </View>

              {data.stamp ? (
                <Image src={data.stamp} style={styles.footerStamp} />
              ) : (
                <View />
              )}

              <Text style={styles.serial}>{data.certificateNumber}</Text>
            </View>
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
