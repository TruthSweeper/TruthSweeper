import json as JSON
import random

allQuestions = []

path = input("File: ")
out = input("Out: ")


def loadQuestions():
    try:
        f = open(path, "r")
        print("Loaded Question File")
        return JSON.loads(f.read())
    except:
        print("No question file found")
        return []
    

allQuestions = loadQuestions()

print("Number of questions: %s" % len(allQuestions))
print("Number of games: %s" % int(len(allQuestions)/12))

maxQLength = 200
maxALength = 50

newQuestions = []

for question in allQuestions:
    if len(question["question"]) > maxQLength:
        continue

    for answer in question["incorrect_answers"]:
        if len(answer) > maxALength:
            continue
    if len(question["correct_answer"]) > maxALength:
        continue

    newQuestions.append(question)


print("Number of questions - cleaned: %s" % len(newQuestions))
print("Number of games - cleaned: %s" % int(len(newQuestions)/12))

f = open(out, "w")
f.write(JSON.dumps(newQuestions))

