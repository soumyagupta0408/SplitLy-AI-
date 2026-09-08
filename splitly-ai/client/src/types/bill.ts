export interface ConfidenceField {
  value: number | null;
  confidence: number;
}

export interface StringConfidenceField {
  value: string | null;
  confidence: number;
}

export interface BillItem {
  name: StringConfidenceField;
  quantity: ConfidenceField;
  unitPrice: ConfidenceField;
  lineTotal: ConfidenceField;
}

export interface TaxLine {
  name: string;
  amount: ConfidenceField;
}

export interface OtherCharge {
  name: string;
  amount: ConfidenceField;
}

export interface Bill {
  currency: string;
  restaurantName: string | null;
  date: string | null;
  items: BillItem[];
  subtotal: ConfidenceField;
  discount: ConfidenceField;
  serviceCharge: ConfidenceField;
  taxes: TaxLine[];
  otherCharges: OtherCharge[];
  printedTotal: ConfidenceField;
}

export interface ExtractionSuccess {
  success: true;
  data: Bill;
}

export interface ExtractionError {
  success: false;
  error: string;
  details?: string;
}

export type ExtractionResponse = ExtractionSuccess | ExtractionError;

// App state
export type AppState = 'idle' | 'preview' | 'extracting' | 'result' | 'error';
