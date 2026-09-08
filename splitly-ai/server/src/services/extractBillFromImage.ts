import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { BillSchema, type Bill } from '../schemas/billSchema.js';

const EXTRACTION_PROMPT = `You are a precise receipt/bill data extractor. Analyze the provided restaurant bill image and extract structured data.

Rules:
- Never invent or guess missing values. Use null when a value is not readable.
- Preserve the exact visible item names as printed on the bill.
- Distinguish between quantity, unit price, and line total for each item.
- Extract EVERY visible tax line separately (e.g., CGST, SGST, VAT, GST, Sales Tax — each as its own entry).
- Extract service charge separately from taxes.
- Preserve discounts as negative values (e.g., -5.00) rather than silently removing them.
- Do NOT assume the printed total is correct — extract it as-is.
- Do NOT perform any calculations or corrections.
- If the subtotal is not explicitly printed, set its value to null.
- Identify the currency from symbols or text on the bill.
- Extract restaurant name and date if visible, otherwise null.

Respond with ONLY valid JSON matching this exact structure (no markdown, no code fences):
{
  "currency": "string (e.g., USD, INR, EUR)",
  "restaurantName": "string or null",
  "date": "string or null (preserve original format)",
  "items": [
    {
      "name": { "value": "string or null", "confidence": 0.0-1.0 },
      "quantity": { "value": number_or_null, "confidence": 0.0-1.0 },
      "unitPrice": { "value": number_or_null, "confidence": 0.0-1.0 },
      "lineTotal": { "value": number_or_null, "confidence": 0.0-1.0 }
    }
  ],
  "subtotal": { "value": number_or_null, "confidence": 0.0-1.0 },
  "discount": { "value": number_or_null, "confidence": 0.0-1.0 },
  "serviceCharge": { "value": number_or_null, "confidence": 0.0-1.0 },
  "taxes": [
    { "name": "string", "amount": { "value": number_or_null, "confidence": 0.0-1.0 } }
  ],
  "otherCharges": [
    { "name": "string", "amount": { "value": number_or_null, "confidence": 0.0-1.0 } }
  ],
  "printedTotal": { "value": number_or_null, "confidence": 0.0-1.0 }
}

Confidence scores:
- 1.0 = clearly readable
- 0.7-0.9 = mostly readable, minor uncertainty
- 0.4-0.6 = partially obscured or ambiguous
- 0.1-0.3 = barely legible, best guess
- 0.0 = complete guess

If an item's quantity is not shown, set quantity to { "value": 1, "confidence": 0.5 } (assumed default, low confidence).
If unit price is not shown but line total is, set unitPrice to null with confidence 0.
If discount is not present on the bill, use { "value": 0, "confidence": 1.0 }.
If service charge is not present, use { "value": 0, "confidence": 1.0 }.`;

export async function extractBillFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<Bill> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const imagePart: Part = {
    inlineData: {
      mimeType,
      data: imageBuffer.toString('base64'),
    },
  };

  const result = await model.generateContent([EXTRACTION_PROMPT, imagePart]);
  const response = result.response;
  const text = response.text();

  // Clean response — remove markdown code fences if Gemini adds them
  const cleanedText = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (e) {
    throw new Error(
      `Failed to parse Gemini response as JSON: ${e instanceof Error ? e.message : String(e)}\n\nRaw response:\n${text.substring(0, 500)}`
    );
  }

  // Validate with Zod
  const validated = BillSchema.safeParse(parsed);
  if (!validated.success) {
    const issues = validated.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Extraction validation failed: ${issues}`);
  }

  return validated.data;
}
