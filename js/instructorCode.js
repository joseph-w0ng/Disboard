'use strict';

(function() {
    var socket = io();
    var instructorSubmitButton = document.getElementById("submitid");

    // var addQuestionUserId = document.getElementById("addQuestionUserId")
    // var addQuestionAssignmentId = document.getElementById("addQuestionAssignmentId")
    // var addQuestionText = document.getElementById("addQuestionText")
    var addQuestionSubmitButton = document.getElementById("addQuestionSubmit");

    var resultDiv = document.getElementById("result");

    instructorSubmitButton.addEventListener("click", getQuestions, false);
    addQuestionSubmitButton.addEventListener("click", addQuestion, false);

    function getQuestions() {
        //console.log("uwu");
        let userid = $("#userid").val();
        console.log(userid);
        let info = {
            "userid": userid
        }
        socket.emit("getQuestions", info);
    }

    socket.on('getQuestionsResponse', (data) => {
        console.log(data.questions);

        var resultHTML = "<table><tr><td>_id</td><td>userid</td><td>assignmentid</td><td>question</td></tr>";
        data.questions.forEach(function (question, index) {
            //console.log(question.userid);
            resultHTML += ("<tr><td><button val='"+question._id+"'>"+question._id+"</button</td><td>"+question.userid+"</td><td>"
            +question.assignmentid+"</td><td>"+question.question+"</td></tr>");
        });

        resultHTML += ("</table>");
        resultDiv.innerHTML = resultHTML;
    });

    function addQuestion() {
        let info = {
            "userid": $("#addQuestionUserId").val(), //#TODO: Add entry box
            "assignmentid": $("#addQuestionAssignmentId").val(), //#TODO: Add entry box
            "question":$("#addQuestionText").val(),
        }
        socket.emit("addQuestion", info);
    }

    socket.on('addQuestionResponse', (data) => {
        console.log("Response received: "+data);
        resultDiv.innerHTML = "<p>Response received: "+data.success+"</p>"
    })

})();