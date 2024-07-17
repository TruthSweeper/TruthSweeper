import requests
import json as JSON
import time

url = "https://opentdb.com/api.php?amount=50&type=multiple"

allQuestions = []

runForever = True

def loadQuestions():
    try:
        f = open("multiple_questions.json", "r")
        print("Loaded Question File")
        return JSON.loads(f.read())
    except:
        print("No question file found")
        return []

def checkExists(newQuestion):
    for question in allQuestions:
        if question["question"] == newQuestion:
            return True

def retrieveQuestions():
    g = requests.get(url)
    json = g.json()
    if json["response_code"] == 0:
        print("Retrieved Questions")

        for question in json["results"]:
            if not checkExists(question["question"]):
                allQuestions.append(question)
                print("Found New Question")
            else:
                print("Found Duplicate")

    f = open("multiple_questions.json", "w")
    f.write(JSON.dumps(allQuestions))

allQuestions = loadQuestions()

if runForever:
    while True:
        retrieveQuestions()
        time.sleep(3)
else:
    retrieveQuestions()