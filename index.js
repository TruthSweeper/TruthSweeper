  function mulberry32(a) {
    return function() {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}


var debug = false

const offsetFromDate = new Date("16 July 2024")
const msOffset = getTodaysDate() - offsetFromDate
const dayOffset = 100//Math.floor(msOffset / 1000 / 60 / 60 / 24)

const numQuestions = 12
const numTells = 4

var selectedQuestion = null
var gameOver = false

var allQuestions = []
var questions = []

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
            let square = $(`<div class="square"><div class="state"></div></div>`)
            square.data("x", x)
            square.data("y", y)
            square.on("click", squareClicked)

            grid[y][x] = square

            row.append(square)
        }

        $("#grid").append(row)
    }

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

    for (let number of numbers) {

        let square = $("#grid").find(".square").eq(number)
        square.addClass("tell")

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

        tell.text(lies.toString())
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

        let shouldBeCorrect = mulberry32((num+1)*(1+dayOffset))() > 0.5

        square.data("index", num)

        let question = questions[num]

        square.data("question", decodeHtml(question.question))

        let answers = question.incorrect_answers
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



}

function updateQuestionButtons(currentState, animate=true) {

    for (let state of ["none", "false", "true"]) {
        $(`#${state}-button`).removeClass(iconClassesCircled[state])
        $(`#${state}-button`).addClass(iconClasses[state])
    }

    $(`#${currentState}-button`).removeClass(iconClasses[currentState])
    $(`#${currentState}-button`).addClass(iconClassesCircled[currentState])
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

    checkCanFinish()

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

        if (square.data("highlighted_answer") === answer) {
            a.addClass("highlight-correct")
        } else {
            a.addClass("highlight-wrong")
        }
        
        $("#answers").append(a)
    }

}

function finish() {
    checkAnswers(questions)
    $("#finish").hide()
    $("#question-options").hide()

    $("#score").text(`${0}/${numQuestions}`)

    $("#results").show()

}

function autoFill() {
    for (let s of $("#grid").find(".square.question")) {

        let square = $(s)

        changeSquareState(square, "false")

    }
}

function checkAnswers(questions) {

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
            }, parseInt(square.data("index"))*450)
        } else {
            setTimeout(() => {
                addThumb(square, false)
            }, parseInt(square.data("index"))*450)

        }



    }


}

var score = 0

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

const allQuestionsPath = "general_questions_v2.json"

$.getJSON(allQuestionsPath, json => {

    allQuestions = json
    for (let i = 0; i < 12; i++) {
        questions.push(allQuestions[(dayOffset*12)+i])
    }

    createGrid(4)
    addTells(4, 16)
    addQuestions(questions)
    updateTells()

})

$(() => {

})