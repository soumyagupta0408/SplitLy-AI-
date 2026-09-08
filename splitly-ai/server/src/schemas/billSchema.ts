import { z } from 'zod';

// Confidence-annotated numeric field
export const ConfidenceFieldSchema = z.object({
  value: z.number().nullable(),
  confidence: z.number().min(0).max(1),
});

// Confidence-annotated string field
export const StringConfidenceFieldSchema = z.object({
  value: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

// Individual line item from the bill
export const BillItemSchema = z.object({
  name: StringConfidenceFieldSchema,
  quantity: ConfidenceFieldSchema,
  unitPrice: ConfidenceFieldSchema,
  lineTotal: ConfidenceFieldSchema,
});

// Individual tax line (each tax extracted separately)
export const TaxLineSchema = z.object({
  name: z.string(),
  amount: ConfidenceFieldSchema,
});

// Individual other charge line
export const OtherChargeSchema = z.object({
  name: z.string(),
  amount: ConfidenceFieldSchema,
});

// Top-level bill schema
export const BillSchema = z.object({
  currency: z.string().default('USD'),
  restaurantName: z.string().nullable().default(null),
  date: z.string().nullable().default(null),
  items: z.array(BillItemSchema),
  subtotal: ConfidenceFieldSchema,
  discount: ConfidenceFieldSchema,
  serviceCharge: ConfidenceFieldSchema,
  taxes: z.array(TaxLineSchema),
  otherCharges: z.array(OtherChargeSchema).default([]),
  printedTotal: ConfidenceFieldSchema,
});

// Inferred types from schemas
export type ConfidenceField = z.infer<typeof ConfidenceFieldSchema>;
export type StringConfidenceField = z.infer<typeof StringConfidenceFieldSchema>;
export type BillItem = z.infer<typeof BillItemSchema>;
export type TaxLine = z.infer<typeof TaxLineSchema>;
export type OtherCharge = z.infer<typeof OtherChargeSchema>;
export type Bill = z.infer<typeof BillSchema>;

// Extraction result wrapper
export const ExtractionResultSchema = z.object({
  success: z.literal(true),
  data: BillSchema,
});

export const ExtractionErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.string().optional(),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
export type ExtractionError = z.infer<typeof ExtractionErrorSchema>;
