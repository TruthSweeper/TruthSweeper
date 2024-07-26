import json as JSON

folder = "questions"
path = "all_questions_shuffled_v2.json"

def loadQuestions():
    try:
        f = open(path, "r")
        print("Loaded Question File")
        return JSON.loads(f.read())
    except:
        print("No question file found")
        return []
    
allQuestions = loadQuestions()

numDays = int(len(allQuestions)/12)

print("Number of questions: %s" % len(allQuestions))
print("Number of games: %s" % numDays)

for day in range(numDays):

    dayQuestions = []

    for q in range(12):
        question = allQuestions[(day*12)+q]
        dayQuestions.append(question)


    f = open("%s/%s.json" % (folder, str(day)), "w")
    f.write(JSON.dumps(dayQuestions))

print("Done")