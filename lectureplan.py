import streamlit as st
import json
import pandas as pd
import os
from groq import Groq
from reportlab.platypus import SimpleDocTemplate, Table
from reportlab.lib import colors
from reportlab.platypus import TableStyle
import tempfile

# ---------------- CONFIG ----------------
st.set_page_config(page_title="AI Lecture Plan Generator", layout="wide")

# Groq API Key from environment
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is missing from environment variables.")

client = Groq(api_key=GROQ_API_KEY)

# ---------------- TITLE ----------------
st.title("📚 AI Lecture Plan Generator")

# ---------------- INPUT ----------------
st.subheader("📥 Course Details")

col1, col2 = st.columns(2)

with col1:
    subject = st.text_input("Subject Name")
    subject_code = st.text_input("Subject Code")

with col2:
    semester = st.text_input("Semester")
    total_lectures = st.number_input("Total Lectures", 1, 200, 40)

st.subheader("📝 Enter Syllabus")

unit1 = st.text_area("Unit I")
unit2 = st.text_area("Unit II")
unit3 = st.text_area("Unit III")
unit4 = st.text_area("Unit IV")
unit5 = st.text_area("Unit V")

generate_btn = st.button("🚀 Generate Lecture Plan")

# ---------------- LLM FUNCTION ----------------
def generate_plan(prompt):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    return response.choices[0].message.content

# ---------------- PDF FUNCTION ----------------
def create_pdf(data):
    file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    doc = SimpleDocTemplate(file.name)

    table_data = [["Lecture No", "Unit", "Topic Covered"]]

    for row in data:
        table_data.append([
            row["lecture_no"],
            row["unit"],
            row["topic"]
        ])

    table = Table(table_data)

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
    ]))

    doc.build([table])
    return file.name

# ---------------- MAIN ----------------
if generate_btn:

    if not any([unit1, unit2, unit3, unit4, unit5]):
        st.warning("⚠️ Please enter syllabus")
        st.stop()

    syllabus = f"""
    Unit I: {unit1}
    Unit II: {unit2}
    Unit III: {unit3}
    Unit IV: {unit4}
    Unit V: {unit5}
    """

    prompt = f"""
You are an academic planner.

Generate a lecture plan in JSON format.

Total lectures: {total_lectures}

Syllabus:
{syllabus}

Rules:
1. Divide lectures across units proportionally
2. Break syllabus into small teachable topics
3. Combine small topics if needed
4. Each lecture must have:
   - lecture_no
   - unit
   - topic
5. Lecture numbers must be continuous
6. Keep topics concise

Return ONLY valid JSON. No explanation.
"""

    with st.spinner("🤖 Generating..."):
        content = generate_plan(prompt)

    try:
        # Clean JSON if wrapped in ```
        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        plan = json.loads(content)

        # 🔥 Handle multiple response formats
        if isinstance(plan, dict):
            if "lectures" in plan:
                plan = plan["lectures"]
            else:
                plan = list(plan.values())[0]

        df = pd.DataFrame(plan)
        df.columns = ["Lecture No", "Unit", "Topic Covered"]

        st.success("✅ Generated Successfully")
        st.dataframe(df, use_container_width=True)

        # -------- DOWNLOAD --------
        st.subheader("⬇️ Download")

        col1, col2 = st.columns(2)

        # Excel
        with col1:
            excel_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
            df.to_excel(excel_file.name, index=False)

            with open(excel_file.name, "rb") as f:
                st.download_button("📊 Download Excel", f, "lecture_plan.xlsx")

        # PDF
        with col2:
            pdf_path = create_pdf(plan)

            with open(pdf_path, "rb") as f:
                st.download_button("📄 Download PDF", f, "lecture_plan.pdf")

    except Exception as e:
        st.error("❌ Error parsing response")
        st.write(content)
        st.write(e)
