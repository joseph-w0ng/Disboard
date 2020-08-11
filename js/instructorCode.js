'use strict';

(function() {
    var socket = io();
    var getAssignmentSubmitButton = document.getElementById("getAssignmentSubmit");
    var addQuestionSubmitButton = document.getElementById("addQuestionSubmit");

    var resultDiv = document.getElementById("result");

    getAssignmentSubmitButton.addEventListener("click", getAssignment, false);
    addQuestionSubmitButton.addEventListener("click", addQuestion, false);

    function getAssignment() {
        //console.log("uwu");
        let instructorid = $("#getAssignmentInstructorId").val();
        let assignmentid = $("#getAssignmentId").val();
        //console.log(userid);
        let info = {
            "instructorid": instructorid,
            "assignmentid": assignmentid,
        }
        socket.emit("getAssignment", info);
    }

    socket.on('getAssignmentResponse', (data) => {
        console.log(data.assignment);

        var resultHTML = "";
        
        resultHTML += "<table><tr><td>ID</td><td>question</td></tr>";
        data.assignment.questions.forEach(function(question, index) {
            //console.log(question.userid);
            resultHTML += ("<tr><td><button>ID</button><td>" + question + "</td></tr>");
        });

        resultHTML += ("</table>");
        resultDiv.innerHTML = resultHTML;
    });

    function addQuestion() {
        let info = {
            "instructor": $("#addQuestionUserId").val(), //#TODO: Add entry box
            "assignmentid": $("#addQuestionAssignmentId").val(), //#TODO: Add entry box
            "question": $("#addQuestionText").val(),
        }
        socket.emit("addQuestion", info);
    }

    socket.on('addQuestionResponse', (data) => {
        console.log("Response received: " + data);
        resultDiv.innerHTML = "<p>Response received: " + data.success + "</p>"
    })

})();