# 🍽️ SplitLy-AI: The Proportional Bill Splitter

> Turn the end-of-dinner social argument into a solved engineering problem.

**SplitLy-AI** is an intelligent, AI-powered receipt splitting application. Unlike traditional split-wise apps that blindly divide taxes, tips, and service charges equally among everyone (the wrong answer everyone accepts), SplitLy-AI extracts line items using **Google Gemini Vision** and calculates exact individual totals based on **true proportional consumption**.

---

## 🛠️ System Architecture & Implementation Details

1. **Extraction Pipeline (Live AI):** 
   - Uses **Google Gemini (`gemini-3.6-flash`)** via the modern `google-genai` SDK.
   - Enforces strict **Pydantic schema validation** (`ReceiptBill`) to ensure the Vision model returns structured JSON with per-field confidence scores. No data is mocked during extraction.
2. **Review & Correction Layer (Human-in-the-Loop):**
   - Automatically flags low-confidence fields (`< 0.8`) with visual warnings (`⚠️`) so users can correct OCR errors *before* any math happens.
3. **Proportional Distribution Engine (Local Python Math):**
   - Deterministic backend calculation. Distributes taxes, service charges, and discounts strictly proportional to each member's consumed subtotal ratio.
   - Handles receipt math discrepancies automatically by reconciling printed totals with line item sums.

---

## 🚀 How to Run It Locally

### Prerequisites
- Python 3.10+ installed on your machine.
- A free **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/soumyagupta0408/SplitLy-AI-.git](https://github.com/soumyagupta0408/SplitLy-AI-.git)
   cd SplitLy-AI
