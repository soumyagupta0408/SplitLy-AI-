import streamlit as st
import pandas as pd
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# ==========================================
# 1. PYDANTIC EXTRACTION SCHEMA
# ==========================================
class ConfidentField(BaseModel):
    value: float = Field(..., description="Numerical value of the field")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")

class StringField(BaseModel):
    value: str = Field(..., description="String value of the field")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")

class LineItem(BaseModel):
    name: StringField
    quantity: ConfidentField
    unit_price: ConfidentField
    total_price: ConfidentField

class ReceiptBill(BaseModel):
    line_items: List[LineItem]
    subtotal: ConfidentField
    tax: ConfidentField
    service_charge: ConfidentField
    discount: ConfidentField = Field(default_factory=lambda: ConfidentField(value=0.0, confidence=1.0))
    total: ConfidentField
    currency: str = Field(default="USD", description="Currency symbol or code")

# ==========================================
# 2. GEMINI VISION EXTRACTION ENGINE
# ==========================================
def extract_receipt_with_gemini(image_bytes: bytes, mime_type: str, api_key: str) -> ReceiptBill:
    # Initialize the Gemini Client
    client = genai.Client(api_key=api_key)
    
    # Create the multimodal parts payload using the modern SDK
    image_part = types.Part.from_bytes(
        data=image_bytes,
        mime_type=mime_type,
    )
    
    prompt = (
        "Extract all line items, quantities, unit prices, subtotal, tax, service charge, "
        "and final total from this restaurant bill. Provide a realistic confidence score "
        "(0.0 to 1.0) for every extracted numerical and string field."
    )
    
    # Call Gemini with structured output enforcement via Pydantic
    response = client.models.generate_content(
        model="gemini-3.6-flash",  # Fast and multimodal-capable model
        contents=[image_part, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ReceiptBill,
            temperature=0.1,  # Low temperature for precise data extraction
        ),
    )
    
    # Gemini automatically parses the output directly into your Pydantic model via response.parsed
    return response.parsed

# ==========================================
# 3. PROPORTIONAL CALCULATION ENGINE
# ==========================================
def calculate_bill_split(
    line_items: List[dict],
    member_names: List[str],
    assignments: Dict[int, List[str]], 
    tax_total: float,
    service_charge_total: float,
    discount_total: float,
    printed_subtotal: float
) -> dict:
    
    members = {name: {"subtotal": 0.0, "items": []} for name in member_names}
    
    for idx, item in enumerate(line_items):
        item_total = item["total_price"]
        shared_by = assignments.get(idx, [])
        
        if not shared_by:
            continue
            
        share_amount = item_total / len(shared_by)
        for member in shared_by:
            if member in members:
                members[member]["subtotal"] += share_amount
                members[member]["items"].append({
                    "name": item["name"],
                    "share_cost": share_amount
                })

    calculated_subtotal = sum(m["subtotal"] for m in members.values())
    subtotal_discrepancy = printed_subtotal - calculated_subtotal
    
    final_breakdown = {}
    total_final_check = 0.0

    for member, data in members.items():
        sub = data["subtotal"]
        ratio = sub / calculated_subtotal if calculated_subtotal > 0 else 0
        
        member_tax = tax_total * ratio
        member_service = service_charge_total * ratio
        member_discount = discount_total * ratio
        member_discrepancy_share = subtotal_discrepancy * ratio
        
        member_total = sub + member_tax + member_service - member_discount + member_discrepancy_share
        total_final_check += member_total
        
        final_breakdown[member] = {
            "consumed_subtotal": round(sub, 2),
            "tax_share": round(member_tax, 2),
            "service_charge_share": round(member_service, 2),
            "discount_share": round(member_discount, 2),
            "math_adjustment": round(member_discrepancy_share, 2),
            "final_total": round(member_total, 2),
            "items": data["items"]
        }

    return {
        "member_breakdown": final_breakdown,
        "reconciliation_delta": round(subtotal_discrepancy, 2),
        "total_accounted": round(total_final_check, 2)
    }

# ==========================================
# 4. STREAMLIT UI WORKFLOW
# ==========================================
st.set_page_config(page_title="Splitly - Gemini Bill Splitter", layout="wide")

with st.sidebar:
    st.header("⚙️ Configuration")
    gemini_api_key = st.text_input("Google Gemini API Key", type="password", help="Get your free key from Google AI Studio.")
    st.markdown("---")
    st.markdown("### About Splitly")
    st.markdown("Powered by **Google Gemini Vision** and Pydantic schema enforcement to accurately split dinner bills proportionally.")

st.title("🍽️ Splitly: The Proportional Bill Splitter")

if "step" not in st.session_state:
    st.session_state.step = 1
if "receipt_data" not in st.session_state:
    st.session_state.receipt_data = None
if "members" not in st.session_state:
    st.session_state.members = ["Alice", "Bob", "Charlie"]

# --- STEP 1: MEMBER SETUP & BILL UPLOAD ---
if st.session_state.step == 1:
    st.header("Step 1: Setup Members & Upload Bill")
    
    col_setup1, col_setup2 = st.columns(2)
    
    with col_setup1:
        num_members = st.selectbox("No. of Members", options=list(range(2, 11)), index=1)
        
        st.markdown("**Enter Member Names:**")
        dynamic_members = []
        default_names = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy"]
        for i in range(num_members):
            default_val = st.session_state.members[i] if i < len(st.session_state.members) else default_names[i]
            m_name = st.text_input(f"Member {i+1} Name", value=default_val, key=f"member_name_{i}")
            dynamic_members.append(m_name.strip())
        st.session_state.members = dynamic_members

    with col_setup2:
        st.markdown("**Upload Bill Receipt Image:**")
        uploaded_file = st.file_uploader("Choose a receipt image...", type=["jpg", "jpeg", "png", "webp"])
        if uploaded_file is not None:
            st.image(uploaded_file, caption="Uploaded Bill", width=280)

    st.divider()
    if st.button("Extract Receipt via Gemini AI 🚀", type="primary"):
        if not gemini_api_key:
            st.error("Please enter your Google Gemini API Key in the sidebar.")
        elif uploaded_file is None:
            st.error("Please upload a receipt image first.")
        else:
            with st.spinner("Analyzing receipt with Google Gemini Vision..."):
                try:
                    image_bytes = uploaded_file.getvalue()
                    mime_type = uploaded_file.type
                    
                    parsed_bill = extract_receipt_with_gemini(image_bytes, mime_type, gemini_api_key)
                    
                    st.session_state.receipt_data = parsed_bill.model_dump()
                    st.session_state.step = 2
                    st.rerun()
                except Exception as e:
                    st.error(f"Extraction failed: {str(e)}")

# --- STEP 2: REVIEW & CORRECT SCREEN ---
elif st.session_state.step == 2:
    st.header("Step 2: Review & Correct Extracted Data")
    st.markdown("Review extracted items below. Fields with lower extraction confidence are flagged with ⚠️.")
    
    data = st.session_state.receipt_data
    
    with st.form("review_form"):
        updated_items = []
        for i, item in enumerate(data["line_items"]):
            col1, col2, col3, col4 = st.columns([3, 1, 1, 1])
            
            name_conf = item["name"]["confidence"]
            price_conf = item["total_price"]["confidence"]
            
            name_label = f"Item {i+1}" + (" ⚠️" if name_conf < 0.8 else "")
            price_label = f"Total ($)" + (" ⚠️" if price_conf < 0.8 else "")
            
            with col1:
                name = st.text_input(name_label, value=item["name"]["value"], key=f"name_{i}")
            with col2:
                qty = st.number_input("Qty", value=float(item["quantity"]["value"]), key=f"qty_{i}")
            with col3:
                unit_p = st.number_input("Unit $", value=float(item["unit_price"]["value"]), key=f"unit_{i}")
            with col4:
                tot_p = st.number_input(price_label, value=float(item["total_price"]["value"]), key=f"tot_{i}")
                
            updated_items.append({
                "name": {"value": name, "confidence": name_conf},
                "quantity": {"value": qty, "confidence": item["quantity"]["confidence"]},
                "unit_price": {"value": unit_p, "confidence": item["unit_price"]["confidence"]},
                "total_price": {"value": tot_p, "confidence": price_conf}
            })
            
        st.divider()
        col_a, col_b, col_c = st.columns(3)
        with col_a:
            subtotal = st.number_input("Subtotal", value=float(data["subtotal"]["value"]))
        with col_b:
            tax = st.number_input("Tax / GST", value=float(data["tax"]["value"]))
        with col_c:
            service = st.number_input("Service Charge", value=float(data["service_charge"]["value"]))
            
        discount = st.number_input("Discount", value=float(data["discount"]["value"]))
        printed_total = st.number_input("Printed Final Total", value=float(data["total"]["value"]))
        
        submitted = st.form_submit_button("Confirm & Proceed to Item Assignment ➡️", type="primary")
        if submitted:
            st.session_state.receipt_data["line_items"] = updated_items
            st.session_state.receipt_data["subtotal"]["value"] = subtotal
            st.session_state.receipt_data["tax"]["value"] = tax
            st.session_state.receipt_data["service_charge"]["value"] = service
            st.session_state.receipt_data["discount"]["value"] = discount
            st.session_state.receipt_data["total"]["value"] = printed_total
            st.session_state.step = 3
            st.rerun()

# --- STEP 3: MEMBER ASSIGNMENT & BREAKDOWN ---
elif st.session_state.step == 3:
    st.header("Step 3: Assign Items & Get Detailed Breakdown")
    
    data = st.session_state.receipt_data
    items = data["line_items"]
    
    raw_items_flat = [{"name": itm["name"]["value"], "total_price": itm["total_price"]["value"]} for itm in items]
    
    st.subheader("Who consumed which item?")
    assignments = {}
    
    for idx, item in enumerate(raw_items_flat):
        st.markdown(f"**{item['name']}** — *${item['total_price']}*")
        assigned = st.multiselect(
            f"Shared by:",
            options=st.session_state.members,
            default=st.session_state.members,
            key=f"assign_{idx}"
        )
        assignments[idx] = assigned
        st.write("---")
        
    if st.button("Calculate Proportional Breakdown 🧮", type="primary"):
        result = calculate_bill_split(
            line_items=raw_items_flat,
            member_names=st.session_state.members,
            assignments=assignments,
            tax_total=data["tax"]["value"],
            service_charge_total=data["service_charge"]["value"],
            discount_total=data["discount"]["value"],
            printed_subtotal=data["subtotal"]["value"]
        )
        
        st.success("Calculation Complete!")
        
        if abs(result["reconciliation_delta"]) > 0.01:
            st.warning(f"⚠️ Receipt Math Adjustment: Line items differed from printed subtotal by ${result['reconciliation_delta']}. Adjusted proportionally.")
            
        cols = st.columns(min(len(result["member_breakdown"]), 3))
        for i, (member, breakdown) in enumerate(result["member_breakdown"].items()):
            with cols[i % len(cols)]:
                st.markdown(f"### 👤 {member}")
                st.metric("Total Due", f"${breakdown['final_total']}")
                with st.expander("View Breakdown Details"):
                    st.write(f"Consumed Items Subtotal: ${breakdown['consumed_subtotal']}")
                    st.write(f"Tax Share: ${breakdown['tax_share']}")
                    st.write(f"Service Charge Share: ${breakdown['service_charge_share']}")
                    if breakdown['math_adjustment'] != 0:
                        st.write(f"Math Adjustment: ${breakdown['math_adjustment']}")
                    st.markdown("**Items Consumed:**")
                    for itm in breakdown['items']:
                        st.text(f"- {itm['name']}: ${round(itm['share_cost'], 2)}")

        st.markdown("---")
        st.subheader("📲 Group Chat Summary")
        summary_text = "🍽️ *Splitly Bill Breakdown (Powered by Gemini)* 🍽️\n"
        for member, breakdown in result["member_breakdown"].items():
            summary_text += f"• {member}: ${breakdown['final_total']}\n"
        
        st.text_area("Copy summary for WhatsApp:", value=summary_text, height=100)

    if st.button("🔄 Start Over"):
        st.session_state.step = 1
        st.rerun()