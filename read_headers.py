import pandas as pd
import sys

file_path = "Dijital yolcu ve DCS auiditq.xlsx"
try:
    df = pd.read_excel(file_path, nrows=0)
    print("Columns found:", list(df.columns))
except Exception as e:
    print("Error:", e)
