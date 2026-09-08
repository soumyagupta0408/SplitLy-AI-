# 🍽️ SplitLy-AI: The Proportional Bill Splitter

> Turn the end-of-dinner social argument into a solved engineering problem.

**SplitLy-AI** is an intelligent, AI-powered receipt splitting application. Unlike traditional split-wise apps that blindly divide taxes, tips, and service charges equally among everyone (the wrong answer everyone accepts), SplitLy-AI extracts line items using **Google Gemini Vision** and calculates exact individual totals based on **true proportional consumption**.

---

## ✨ Key Features

- **📸 Gemini-Powered Vision Extraction:** Upload a receipt image, and Google Gemini extracts structured line items, quantities, unit prices, taxes, and service charges automatically via Pydantic schemas.
- **👥 Dynamic Member Config:** Set up your dinner party size (from 2 up to 10 members) and customize names upfront before diving into assignments.
- **🔍 Human-in-the-Loop Review:** Review extracted data with confidence score indicators (`⚠️`). Easily override misread items or typos *before* any arithmetic happens.
- **⚖️ True Proportional Distribution:** Taxes, service charges, and discounts are distributed strictly proportional to what each individual actually consumed—not divided equally by head count.
- **🛠️ Receipt Math Discrepancy Reconciliation:** Automatically detects minor rounding or math errors printed by the restaurant and reconciles them smoothly across users.
- **📲 Group Chat Summary:** Instantly generate a clean text breakdown formatted to copy and paste directly into WhatsApp or group chats.

---

## 🚀 Tech Stack

- **Frontend & UI:** Streamlit
- **AI / OCR Extraction:** Google Gemini API (`gemini-3.6-flash`) with structured JSON outputs
- **Data Validation & Structure:** Pydantic
- **Data Processing:** Python, Pandas

---

## 📦 Installation & Quickstart

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/soumyagupta0408/SplitLy-AI-.git](https://github.com/soumyagupta0408/SplitLy-AI-.git)
   cd SplitLy-AI
