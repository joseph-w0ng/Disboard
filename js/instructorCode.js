'use strict';

(function() {
    var socket = io();
    var instructorSubmitButton = document.getElementById("submitid");
    var questionSubmitButton = document.getElementById("submitQuestion");

    var resultDiv = document.getElementById("result");

    instructorSubmitButton.addEventListener("click", getQuestions, false);
    questionSubmitButton.addEventListener("click", addQuestion, false);

    function getQuestions() {
        //console.log("uwu");
        let userid = parseInt($("#userid").val());
        console.log(userid);
        let info = {
            "userid": userid
        }
        socket.emit("getQuestions", info);
    }

    socket.on('getQuestionsResponse', (data) => {
        console.log(data.questions);

        var resultHTML = "<table><tr><td>Userid</td><td>Assignmentid</td><td>Question</td><td></td></tr>";
        data.questions.forEach(function (question, index) {
            //console.log(question.userid);
            resultHTML += ("<tr><td>"+question.userid+"</td><td>"
            +question.assignmentid+"</td><td>"+question.question+"</td><td><button>Deploy</button</td></tr>");
        });

        resultHTML += ("</table>");
        resultDiv.innerHTML = resultHTML;
    });

    function addQuestion() {
        let info = {
            "userid": 1, //#TODO: Add entry box
            "assignmentid": 1, //#TODO: Add entry box
            "question":$("#question").val(),
        }
        socket.emit("addQuestion", info);
    }

    socket.on('addQuestionResponse', (data) => {
        console.log("Response received: "+data);
        resultDiv.innerHTML = "<p>"+data.success+"</p>"
    })

})();