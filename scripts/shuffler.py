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

random.shuffle(allQuestions)


print("Number of questions: %s" % len(allQuestions))
print("Number of games: %s" % int(len(allQuestions)/12))

f = open(out, "w")
f.write(JSON.dumps(allQuestions))

