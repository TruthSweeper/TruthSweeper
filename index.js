  function mulberry32(a) {
    return function() {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}


var debug = false

const questionPath = "questions"

const offsetFromDate = new Date("3 August 2024")
const msOffset = getTodaysDate() - offsetFromDate
const dayOffset = Math.floor(msOffset / 1000 / 60 / 60 / 24)

const numQuestions = 12
const numTells = 4

var selectedQuestion = null
var gameOver = false
var gameStarted = false

// var allQuestions = []
var questions = []

var openedStats = false

console.log(dayOffset)

function getTodaysDate() {
    if (debug) {
      return new Date("23 September 2023")
    } else {
      return new Date()
    }
}

const booleanAnswers = {
    "True":true,
    "False":false,
    "true":true,
    "false":false,
}

const iconClassesCircled = {
    "none":"bi-question-circle-fill",
    "true":"bi-check-circle-fill",
    "false":"bi-x-circle-fill",
}

const iconClasses = {
    "none":"bi-question",
    "true":"bi-check",
    "false":"bi-x",
}


function decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

var grid = []

function createGrid(size) {

    for (let y = 0; y < size; y++) {

        let row = $(`<div class="grid-row"></div>`)

        row.data("y", y)

        grid.push([])

        for (let x = 0; x < size; x++) {
            let square = $(`<div class="square"><div class="state"><div class="state-back bi bi-circle-fill"></div></div></div>`)
            square.data("x", x)
            square.data("y", y)
            square.data("mark", "none")
            square.on("click", squareClicked)

            grid[y][x] = square

            row.append(square)
        }

        $("#grid").append(row)
    }

}

function shuffleArray(array, seed) {

    let shuffled = []

    let count = 1

    while (array.length > 0) {

        let index = Math.floor(mulberry32(seed*count)()*array.length)
        shuffled.push(array[index])
        array.splice(index, 1)
        count += 1

    }

    return shuffled

}

function addTells(amount, max) {

    var numbers = []

    let random = dayOffset
    let last = 1
    
    for (let i = 0; i < 100; i++) {

        last = random
        random = mulberry32(Math.floor(random*1000*last))()

        let number = Math.floor(random*max)

        if (numbers.includes(number)) {
            continue
        }
        numbers.push(number)
        if (numbers.length >= amount) {
            break
        }
    }

    let neighbourFreq = [[], [], [], [], [], [], [], [], []]

    for (let number of numbers) {

        let square = $("#grid").find(".square").eq(number)
        square.addClass("tell")

        let neighbours = getQuestionNeighbours(square, 4)

        neighbourFreq[neighbours.length].push(square)

        // neighbours[0].data("mark_false", true)

    }

    //This is fucking terrible, don't talk 2 me

    for (let n = 1; n < neighbourFreq.length; n++) {

        for (let index = 0; index < neighbourFreq[n].length; index++) {

            let square = neighbourFreq[n][index]
            let neighbours = shuffleArray(getQuestionNeighbours(square, 4), (dayOffset+1)*(index+1)*(n+1))

            if (neighbours.length === 1) {
                neighbours[0].data("mark", "false")
                continue
            }

            let marked = 0
            // console.log(Math.floor(mulberry32((dayOffset+1)*(index+1)*(n+1))()*neighbours.length)+1)
            let markMax = Math.min(neighbours.length-1, Math.floor(mulberry32((dayOffset+1)*(index+1)*(n+1))()*neighbours.length)+1)
            // let markMax = Math.min(neighbours.length-1, Math.max(1, Math.floor(mulberry32((dayOffset+1)*(index+1)*(n+1))()*neighbours.length)))

            for (let neighbour of neighbours) {
                if (neighbour.data("mark") === "false") {
                    marked += 1
                }
            }

            for (let neighbour of neighbours) {

                if (neighbour.data("mark") === "none") {

                    if (marked >= markMax) {
                        neighbour.data("mark", "true")
                    } else {
                        neighbour.data("mark", "false")
                        marked += 1
                    }

                }

            }

        }

    }


}




function updateTells() {

    for (let t of $("#grid").find(".square.tell")) {

        let tell = $(t)

        let lies = 0

        for (let neighbour of getNeighbours(tell, 4)) {

            if (neighbour.hasClass("tell")) {
                continue
            }

            if (!neighbour.data("correct")) {
                lies += 1
            }
        }

        let text = $(`<div class="tell-text"><div class="tell-num">${lies}</div><div class="tell-info">incorrect</div></div></div>`)

        tell.text("")
        tell.append(text)
    }

}


//Pure Questions Version
// function addQuestions(questions) {

//     let num = 0

//     for (let s of $("#grid").find(".square")) {

//         let square = $(s)

//         if (square.hasClass("tell")) {
//             continue
//         }

//         square.addClass("question")

//         square.addClass("bi")
//         square.data("state", "none")
//         changeSquareState(square, "none")


//         let question = questions[num]

//         square.data("index", num)

//         square.data("question", decodeHtml(question.question))
//         square.data("answer", booleanAnswers[question.correct_answer])
//         square.data("difficulty", question.difficulty)
//         square.data("category", question.category)

//         num += 1

//     }
// }

//Multiple Answer Version
function addQuestions(questions) {

    let num = 0

    for (let s of $("#grid").find(".square")) {

        let square = $(s)

        if (square.hasClass("tell")) {
            continue
        }

        square.addClass("question")

        square.addClass("bi")
        square.data("state", "none")
        changeSquareState(square, "none")

        let shouldBeCorrect 

        // if (square.data("mark_false")) {
        //     shouldBeCorrect = false
        // } else {
        //     shouldBeCorrect = mulberry32((num+1)*(1+dayOffset))() > 0.5
        // }

        switch(square.data("mark")) {

            case "false":
                shouldBeCorrect = false
                break;
            case "true":
                shouldBeCorrect = true
                break;
            case "none":
                shouldBeCorrect = mulberry32((num+1)*(1+dayOffset))() > 0.5
                break;

        }

        square.data("index", num)

        let question = questions[num]

        square.data("question", decodeHtml(question.question))

        let answers = question.incorrect_answers.slice()
        answers.splice(Math.floor(mulberry32(num*dayOffset)()*question.incorrect_answers.length), 0, question.correct_answer)

        let highlight

        if (shouldBeCorrect) {
            highlight = question.correct_answer
        } else {
            highlight = question.incorrect_answers[Math.floor(question.incorrect_answers.length*mulberry32(num*dayOffset)())]
        }

        square.data("answers", answers)
        square.data("highlighted_answer", highlight)
        square.data("correct_answer", question.correct_answer)

        square.data("correct", shouldBeCorrect)
        square.data("difficulty", question.difficulty)
        square.data("category", question.category)

        num += 1

    }
}


function getNeighbours(square, size) {

    let neighbours = []

    let x = square.data("x")
    let y = square.data("y")

    for (let mX of [-1, 0, 1]) {
        for (let mY of [-1, 0, 1]) {

            if (mX === 0 && mY === 0) {
                continue
            }

            if (x+mX < size && x+mX >= 0) {
                if (y+mY < size && y+mY >= 0) {
                    neighbours.push(grid[y+mY][x+mX])
                }
            }

        }
    }

    return neighbours

}

function getQuestionNeighbours(square, size) {

    let neighbours = getNeighbours(square, size)
    let newNeighbours = []

    for (let neighbour of neighbours) {
        if (neighbour.hasClass("tell")) {
            continue
        }
        newNeighbours.push(neighbour)
    }

    return newNeighbours

}

function squareClicked(event) {
    let square = $(event.target)

    if (square.hasClass("question")) {

        if (selectedQuestion) {
            selectedQuestion.removeClass("selected")
        }

        
        updateCurrentQuestion(square)

        selectedQuestion = square
        selectedQuestion.addClass("selected")

        if (!gameOver) {
            updateQuestionButtons(selectedQuestion.data("state"), false)
        }


        $("#current-question").show()


    }


}

function changeSquareState(square, newState) {

    let icon = $(square.find(".state"))

    icon.removeClass(square.data("state"))
    icon.removeClass(iconClassesCircled[square.data("state")])

    square.data("state", newState)

    icon.addClass(newState)
    icon.addClass(iconClassesCircled[newState])

    icon.addClass("changed")
    icon.on("animationend", () => {
        icon.removeClass("changed")
    })

    if (gameStarted) {
        saveGrid()
    }

    checkCanFinish()


}

function updateQuestionButtons(currentState, animate=true) {

    for (let state of ["none", "false", "true"]) {
        $(`#${state}-button`).removeClass(iconClassesCircled[state])
        $(`#${state}-button`).addClass(iconClasses[state])
        if ($(`#${state}-button`).find(".state-back")) {
            $(`#${state}-button`).find(".state-back").hide()
        }
        
    }

    $(`#${currentState}-button`).removeClass(iconClasses[currentState])
    $(`#${currentState}-button`).addClass(iconClassesCircled[currentState])
    if ($(`#${currentState}-button`).find(".state-back")) {
        $(`#${currentState}-button`).find(".state-back").show()
    }
    if (animate) {
        $(`#${currentState}-button`).addClass("clicked")
        $(`#${currentState}-button`).on("animationend", () => {
            $(`#${currentState}-button`).removeClass("clicked")
        })
    }

}

function markQuestion(newState) {

    if (!selectedQuestion) {
        return
    }

    changeSquareState(selectedQuestion, newState)
    updateQuestionButtons(newState)

}

function clearAnswers() {
    for (let child of $("#answers").children()) {
        $(child).remove()
    }
}

function updateCurrentQuestion(square) {

    $("#current-question-text").text(square.data("question"))

    clearAnswers()

    for (let answer of square.data("answers")) {
        let a = $(`<div class="answer">${answer}</div>`)

        if (gameOver) {

            if (square.data("correct_answer") === answer) {
                a.addClass("highlight-real-correct")
            } else {
                if (square.data("highlighted_answer") === answer) {
                    a.addClass("highlight-correct")
                } else {
                    a.addClass("highlight-real-wrong")
                }
            }
        } else {

            if (square.data("highlighted_answer") === answer) {
                a.addClass("highlight-correct")
            } else {
                a.addClass("highlight-wrong")
            }
        }
        
        $("#answers").append(a)
    }

}

function finish() {

    openedStats = false

    gameOver = true

    fastScore = calculateScore(questions)

    if (selectedQuestion) {
        updateCurrentQuestion(selectedQuestion)
    }

    checkAnswers()
    $("#finish").hide()
    $("#question-options").hide()
    $("#question-prompt").hide()


    $("#score").text(`${0}/${numQuestions}`)

    $("#results").show()

    window.localStorage.setItem("finished", true)

    saveToday()

    $(".post-game").show()

    increaseStreak()

    updateStats()

}

function autoFill() {
    for (let s of $("#grid").find(".square.question")) {

        let square = $(s)

        changeSquareState(square, "false")

    }
}

const answerDelay = 450
const statsDelay = 250


function checkAnswers() {

    for (let s of $("#grid").find(".square.question")) {

        let square = $(s)

        if (square.data("state") === "none") {
            return
        }

        let answer = booleanAnswers[square.data("state")]

        // let question = questions[parseInt(square.data("index"))]

        if (square.data("correct") === answer) {
            setTimeout(() => {
                addThumb(square, true)
                increaseScore()
            }, parseInt(square.data("index"))*answerDelay)
        } else {
            setTimeout(() => {
                addThumb(square, false)
            }, parseInt(square.data("index"))*answerDelay)

        }

        setTimeout(() => {
            if (!openedStats) {
                openStats()
            }
        }, ($("#grid").find(".square.question").length*answerDelay)+statsDelay)



    }


}


function calculateScore(questions) {


    let cScore = 0

    for (let s of $("#grid").find(".square.question")) {

        let square = $(s)

        if (square.data("state") === "none") {
            return
        }

        let answer = booleanAnswers[square.data("state")]

        // let question = questions[parseInt(square.data("index"))]

        if (square.data("correct") === answer) {
            cScore += 1
            square.addClass("fast-correct")
        } else {
            square.addClass("fast-wrong")
        }
    }

    return cScore


}

var score = 0
var fastScore = 0

function increaseScore() {
    score += 1
    $("#score").addClass("increased")
    $("#score").text(`${score}/${numQuestions}`)
    $("#score").on("animationend", () => {
        $("#score").removeClass("increased")
    })
}

function addThumb(square, correct) {


    // square.addClass("answer")
    square.addClass(correct ? "correct" : "wrong")


    let thumb
    
    if (correct) {
        thumb = $(`<div class="answer-icon bi bi-hand-thumbs-up-fill correct"></div>`)
    } else {
        thumb = $(`<div class="answer-icon bi bi-hand-thumbs-down-fill wrong"></div>`)
    }

    square.append(thumb)

}

function checkCanFinish() {

    for (let s of $("#grid").find(".square.question")) {
        let square = $(s)
        if (square.data("state") === "none") {
            $("#finish").hide()
            return
        }
    }

    $("#finish").show()

}

function openHelp() {
    $("#help").show()
}

function closeHelp() {
    $("#help").hide()
}

function openStats() {
    $("#stats").show()
    openedStats = true
}


function closeStats() {
    $("#stats").hide()
}


function loadGame() {

    let saveStringDate = window.localStorage.getItem("current-date")

    if (saveStringDate) {
        if (!(dayOffset === parseInt(saveStringDate))) {

            window.localStorage.setItem("current-date", dayOffset)
            window.localStorage.removeItem("today-grid")
            window.localStorage.removeItem("finished")

        }
    } else {
        window.localStorage.setItem("current-date", dayOffset)
    }

    let saveStringGrid = window.localStorage.getItem("today-grid")

    if (saveStringGrid) {

        let grid = JSON.parse(saveStringGrid)

        let questions = $("#grid").find(".square.question")

        for (let s = 0; s < numQuestions; s++) {

            let question = $(questions.eq(s))
            changeSquareState(question, grid[s])

        }

    }

    if (window.localStorage.getItem("finished")) {
        finish()
    }

}

function saveGrid() {

    let grid = []

    let questions = $("#grid").find(".square.question")

    for (let s = 0; s < numQuestions; s++) {

        let question = $(questions.eq(s))

        grid.push(question.data("state"))

    }

    window.localStorage.setItem("today-grid", JSON.stringify(grid))

}

function saveToday() {

    let saveString = window.localStorage.getItem("days")

    let days

    if (saveString) {

        days = JSON.parse(saveString)

    } else {
        days = {}
    }

    days[dayOffset.toString()] = fastScore

    window.localStorage.setItem("days", JSON.stringify(days))

}

function increaseStreak() {

    let lastGame = window.localStorage.getItem("lastGame")

    if (lastGame) {
        if (parseInt(lastGame) < dayOffset) {
            window.localStorage.setItem("streak", getStreak()+1)
            window.localStorage.setItem("lastGame", dayOffset)
        }
    } else {
        window.localStorage.setItem("streak", 1)
        window.localStorage.setItem("lastGame", dayOffset)
    }
}

function getStreak() {

    if (window.localStorage.getItem("streak")) {
        return parseInt(window.localStorage.getItem("streak"))
    } else {
        return 0
    }

}

function updateStreak() {

    let lastGame = window.localStorage.getItem("lastGame")

    if (lastGame) {
        if (dayOffset-parseInt(lastGame) > 1) {
            window.localStorage.setItem("streak", 0)
        }
    } else {
        window.localStorage.setItem("streak", 0)
    }

}

function updateStats() {

    $("#todays-score").text(`Today's Score: ${fastScore}/12`)

    let streak = getStreak()

    if (streak > 0) {
        $("#streak").show()
    } else {
        $("#streak").hide()

    }

    $("#streak-text").text(`${streak} Day Streak`)

    let saveStringDays = window.localStorage.getItem("days")

    let days = {}

    if (saveStringDays) {
        days = JSON.parse(saveStringDays)
    }

    let distro = {}

    for (let s = 0; s < numQuestions+1; s++) {
        distro[s] = 0
    }

    for (let day of Object.keys(days)) {

        distro[days[day]] += 1

    }

    $("#games-played").text(`${Object.keys(days).length} Games Played`)

    configureDistro(distro, Object.keys(days).length)


}

function createDistro() {

    for (let b = 0; b < numQuestions+1; b++) {

        let bar = $(`<div class="bar-container"><div class="bar">0</div><h5 class="bar-number">${b}</h5></div>`)
        $("#bars").append(bar)

    }

}

function configureDistro(distro, total) {
    
    for (let b = 0; b < numQuestions+1; b++) {

        let barContainer = $("#bars").children().eq(b)
        let bar = barContainer.find(".bar").eq(0)
        // bar.css("height", "200px")

        if (distro[b] > 0) {
            bar.css("height", String(Math.max((distro[b]/total)*100, 5))+"%")
            bar.text(distro[b])

        } else {
            bar.text("")
            bar.css("height", "5px")

        }



    }

}

const shareColours = {
  correct:"✅",
  wrong:"❌",
  tell:"💣",
}


function share() {

    let message = `Truth Sweeper ${dayOffset}\n${fastScore}/12\n`

    let count = 0

    for (let square of $("#grid").find(".square")) {

        if (count >= 4) {
            message = message + "\n"
            count = 0
        }

        if ($(square).hasClass("tell")) {
            message = message + shareColours.tell 
        } else if ($(square).hasClass("fast-correct")) {
            message = message + shareColours.correct
        } else {
            message = message + shareColours.wrong
        }

        count += 1

    }

    message = message + `\nhttps://truthsweeper.com`
    navigator.clipboard.writeText(message)


}

$.getJSON(`${questionPath}/${dayOffset}.json`, json => {

    // allQuestions = json
    // for (let i = 0; i < 12; i++) {
    //     questions.push(allQuestions[(dayOffset*12)+i])
    // }

    questions = json

    createGrid(4)
    addTells(4, 16)
    addQuestions(questions)
    updateTells()
    createDistro()
    loadGame()
    updateStreak()
    updateStats()

    gameStarted = true

})

$(() => {

})