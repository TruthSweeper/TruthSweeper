import json as JSON
import random

allQuestions = []

path = input("File: ")

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


print(allQuestions[int(random.randrange(0, len(allQuestions)))])