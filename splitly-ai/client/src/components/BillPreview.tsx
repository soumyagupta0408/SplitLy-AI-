import type { Bill, ConfidenceField, StringConfidenceField } from '../types/bill';

interface BillPreviewProps {
  bill: Bill;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  let color: string;
  let label: string;

  if (confidence >= 0.8) {
    color = 'bg-green-100 text-green-700';
    label = 'High';
  } else if (confidence >= 0.5) {
    color = 'bg-amber-100 text-amber-700';
    label = 'Medium';
  } else {
    color = 'bg-red-100 text-red-700';
    label = 'Low';
  }

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${color}`}>
      {label} ({Math.round(confidence * 100)}%)
    </span>
  );
}

function formatValue(field: ConfidenceField, currency: string): string {
  if (field.value === null) return '—';
  return `${currency} ${field.value.toFixed(2)}`;
}

function formatStringValue(field: StringConfidenceField): string {
  return field.value ?? '—';
}

function SummaryRow({
  label,
  field,
  currency,
  highlight = false,
  isNegative = false,
}: {
  label: string;
  field: ConfidenceField;
  currency: string;
  highlight?: boolean;
  isNegative?: boolean;
}) {
  if (field.value === null && field.confidence === 0) return null;

  return (
    <div className={`flex items-center justify-between py-2 ${
      highlight ? 'font-bold text-lg border-t-2 border-gray-300 pt-3' : ''
    }`}>
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-3">
        <ConfidenceBadge confidence={field.confidence} />
        <span className={`font-mono ${
          isNegative && field.value !== null && field.value < 0
            ? 'text-green-600'
            : highlight
              ? 'text-gray-900'
              : 'text-gray-700'
        }`}>
          {formatValue(field, currency)}
        </span>
      </div>
    </div>
  );
}

export default function BillPreview({ bill }: BillPreviewProps) {
  const currency = bill.currency;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Restaurant Info Header */}
      {(bill.restaurantName || bill.date) && (
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {bill.restaurantName && (
              <h3 className="text-lg font-semibold text-gray-800">
                {bill.restaurantName}
              </h3>
            )}
            {bill.date && (
              <span className="text-sm text-gray-500">{bill.date}</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">Currency: {currency}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Line Items ({bill.items.length})
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">#</th>
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">Item</th>
                <th className="text-right py-2 pr-4 text-gray-500 font-medium">Qty</th>
                <th className="text-right py-2 pr-4 text-gray-500 font-medium">Unit Price</th>
                <th className="text-right py-2 pr-4 text-gray-500 font-medium">Line Total</th>
                <th className="text-right py-2 text-gray-500 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, idx) => {
                // Average confidence across all fields for overall row indicator
                const avgConf =
                  (item.name.confidence +
                    item.quantity.confidence +
                    item.unitPrice.confidence +
                    item.lineTotal.confidence) /
                  4;

                return (
                  <tr
                    key={idx}
                    className={`border-b border-gray-100 ${
                      avgConf < 0.5 ? 'bg-red-50/50' : avgConf < 0.8 ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3 pr-4 text-gray-400">{idx + 1}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {formatStringValue(item.name)}
                        </span>
                        {item.name.confidence < 0.8 && (
                          <ConfidenceBadge confidence={item.name.confidence} />
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-gray-700">
                      {item.quantity.value ?? '—'}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-gray-700">
                      {formatValue(item.unitPrice, currency)}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono font-medium text-gray-900">
                      {formatValue(item.lineTotal, currency)}
                    </td>
                    <td className="py-3 text-right">
                      <ConfidenceBadge confidence={avgConf} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Bill Summary
        </h4>
        <div className="space-y-1">
          <SummaryRow label="Subtotal" field={bill.subtotal} currency={currency} />

          {bill.discount.value !== null && bill.discount.value !== 0 && (
            <SummaryRow
              label="Discount"
              field={bill.discount}
              currency={currency}
              isNegative
            />
          )}

          {bill.serviceCharge.value !== null && bill.serviceCharge.value !== 0 && (
            <SummaryRow
              label="Service Charge"
              field={bill.serviceCharge}
              currency={currency}
            />
          )}

          {bill.taxes.map((tax, idx) => (
            <SummaryRow
              key={idx}
              label={tax.name}
              field={tax.amount}
              currency={currency}
            />
          ))}

          {bill.otherCharges.map((charge, idx) => (
            <SummaryRow
              key={`other-${idx}`}
              label={charge.name}
              field={charge.amount}
              currency={currency}
            />
          ))}

          <SummaryRow
            label="Printed Total"
            field={bill.printedTotal}
            currency={currency}
            highlight
          />
        </div>
      </div>

      {/* Confidence Legend */}
      <div className="px-6 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>Confidence:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400" /> High (≥80%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Medium (50-79%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" /> Low (&lt;50%)
          </span>
        </div>
      </div>
    </div>
  );
}
