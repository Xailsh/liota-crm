/**
 * Certificate Generator
 * Generates a PDF certificate for students who complete a placement test.
 * Uses pdfkit and uploads the result to S3.
 */
import PDFDocument from "pdfkit";
import { storagePut } from "./storage";

export interface CertificateOptions {
  studentName: string;
  cefrLevel: string;
  testTitle: string;
  score: number;
  completedAt: Date;
  submissionId: number;
}

const CEFR_DESCRIPTIONS: Record<string, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Intermediate",
  C1: "Advanced",
  C2: "Proficient",
};

const CEFR_COLORS: Record<string, [number, number, number]> = {
  A1: [100, 116, 139],  // slate
  A2: [59, 130, 246],   // blue
  B1: [20, 184, 166],   // teal
  B2: [34, 197, 94],    // green
  C1: [245, 158, 11],   // amber
  C2: [168, 85, 247],   // purple
};

export async function generateCertificate(opts: CertificateOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 40, bottom: 40, left: 60, right: 60 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        const key = `certificates/cert-${opts.submissionId}-${Date.now()}.pdf`;
        const { url } = await storagePut(key, pdfBuffer, "application/pdf");
        resolve(url);
      } catch (err) {
        reject(err);
      }
    });
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const color = CEFR_COLORS[opts.cefrLevel] ?? [59, 130, 246];
    const hexColor = `#${color.map((c) => c.toString(16).padStart(2, "0")).join("")}`;

    // ── Background ──────────────────────────────────────────────────────────
    doc.rect(0, 0, pageWidth, pageHeight).fill("#FAFAF9");

    // ── Top accent bar ───────────────────────────────────────────────────────
    doc.rect(0, 0, pageWidth, 12).fill(hexColor);

    // ── Bottom accent bar ────────────────────────────────────────────────────
    doc.rect(0, pageHeight - 12, pageWidth, 12).fill(hexColor);

    // ── Decorative side bars ─────────────────────────────────────────────────
    doc.rect(0, 12, 8, pageHeight - 24).fill(hexColor);
    doc.rect(pageWidth - 8, 12, 8, pageHeight - 24).fill(hexColor);

    // ── Inner border ─────────────────────────────────────────────────────────
    doc.rect(24, 24, pageWidth - 48, pageHeight - 48)
      .lineWidth(1.5)
      .strokeColor(hexColor)
      .stroke();

    // ── LIOTA Logo / Institute name ──────────────────────────────────────────
    doc.fontSize(11)
      .fillColor("#6B7280")
      .font("Helvetica")
      .text("LIOTA — Language Institute Of The Americas", 0, 52, { align: "center" });

    // ── "Certificate of Achievement" heading ────────────────────────────────
    doc.fontSize(28)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text("Certificate of Achievement", 0, 80, { align: "center" });

    // ── Divider ──────────────────────────────────────────────────────────────
    const divY = 122;
    doc.moveTo(120, divY).lineTo(pageWidth - 120, divY)
      .lineWidth(1)
      .strokeColor("#E5E7EB")
      .stroke();

    // ── "This is to certify that" ────────────────────────────────────────────
    doc.fontSize(13)
      .fillColor("#6B7280")
      .font("Helvetica")
      .text("This is to certify that", 0, 140, { align: "center" });

    // ── Student name ─────────────────────────────────────────────────────────
    doc.fontSize(34)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text(opts.studentName, 0, 165, { align: "center" });

    // ── "has successfully completed" ─────────────────────────────────────────
    doc.fontSize(13)
      .fillColor("#6B7280")
      .font("Helvetica")
      .text("has successfully completed the", 0, 215, { align: "center" });

    // ── Test title ───────────────────────────────────────────────────────────
    doc.fontSize(16)
      .fillColor("#374151")
      .font("Helvetica-Bold")
      .text(opts.testTitle, 0, 238, { align: "center" });

    // ── "and achieved" ───────────────────────────────────────────────────────
    doc.fontSize(13)
      .fillColor("#6B7280")
      .font("Helvetica")
      .text("and achieved a score of", 0, 268, { align: "center" });

    // ── Score ────────────────────────────────────────────────────────────────
    doc.fontSize(22)
      .fillColor(hexColor)
      .font("Helvetica-Bold")
      .text(`${opts.score}%`, 0, 290, { align: "center" });

    // ── CEFR badge box ───────────────────────────────────────────────────────
    const badgeW = 180;
    const badgeH = 60;
    const badgeX = (pageWidth - badgeW) / 2;
    const badgeY = 326;
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 10)
      .fill(hexColor);

    doc.fontSize(28)
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .text(opts.cefrLevel, badgeX, badgeY + 8, { width: badgeW, align: "center" });

    doc.fontSize(11)
      .fillColor("#FFFFFF")
      .font("Helvetica")
      .text(CEFR_DESCRIPTIONS[opts.cefrLevel] ?? "", badgeX, badgeY + 40, { width: badgeW, align: "center" });

    // ── Date ─────────────────────────────────────────────────────────────────
    const dateStr = opts.completedAt.toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
    doc.fontSize(11)
      .fillColor("#9CA3AF")
      .font("Helvetica")
      .text(`Issued on ${dateStr}`, 0, 406, { align: "center" });

    // ── Signature line ───────────────────────────────────────────────────────
    const sigY = pageHeight - 80;
    const sigX = pageWidth / 2 - 80;
    doc.moveTo(sigX, sigY).lineTo(sigX + 160, sigY)
      .lineWidth(1)
      .strokeColor("#D1D5DB")
      .stroke();
    doc.fontSize(10)
      .fillColor("#6B7280")
      .font("Helvetica")
      .text("Director, LIOTA", 0, sigY + 6, { align: "center" });

    doc.end();
  });
}
