import pandas as pd
import numpy as np
import json as JSON

csv = input("Input CSV: ")
out = input("Output File: ")

df = pd.read_csv(csv)
df = df.replace(np.nan, None)


allQuestions = []


for i in range(len(df)):

    frame = df.loc[i]

    question = {
        "type": "multiple",
        "difficulty": "unknown",
        "category": "General",
        "question": frame["Questions"],
        "correct_answer": frame["Correct"],
        "incorrect_answers": []
    }

    for q in ["A", "B", "C", "D"]:
        if not (frame[q] == frame["Correct"]):
            question["incorrect_answers"].append(frame[q])
            
    allQuestions.append(question)

print(len(allQuestions))

f = open(out, "w")

f.write(JSON.dumps(allQuestions))

f.close()

