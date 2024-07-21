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

maxQLength = 200

newQuestions = []

for question in allQuestions:
    if len(question["question"]) > maxQLength:
        continue

    newQuestions.append(question)


print("Number of questions: %s" % len(newQuestions))
print("Number of games: %s" % int(len(newQuestions)/12))

f = open(out, "w")
f.write(JSON.dumps(newQuestions))

