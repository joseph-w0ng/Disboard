'use strict';

(function() {
    $("#assignmentQuestions").hide();
    var socket = io();
    let userId = null;
    let assignmentId = null;

    var resultDiv = document.getElementById("result");

    // instructorSubmitButton.addEventListener("click", getQuestions, false);
    $("#getAssignmentSubmit").click(() => {
        $("#assignmentQuestions").hide();
        userId = $("#userId").val();
        assignmentId = $("#assignmentId").val();
        let info = {
            "userid": userId,
            "assignmentid": assignmentId
        }
        socket.emit("getQuestions", info);
    });

    $("#newAssignmentSubmit").click(() => {
        userId = $("#userId").val();
        assignmentId = $("#assignmentId").val();
        $("#inputs").empty();
        $("#assignmentQuestions").show();
    });

    $("#addQuestions").click(() => {
        var new_input = "<input type='text' class='questions'>";
        $("#inputs").append(new_input);
    });

    $("#submitQuestions").click(() => {
        let questions = [];
        $(".questions").each(function(i, question) {
            questions.push($(question).val());
        });
        var userId = $("#userId").val();
        var assignmentId = $("#assignmentId").val();
        let info = {
            "userid": userId, //#aTODO: Add entry box
            "assignmentid": assignmentId, //#TODO: Add entry box
            "questions": questions,
        }
        console.log(info);
        socket.emit("addQuestions", info);
    });

    socket.on('getQuestionsResponse', (data) => {
        $("#inputs").empty();

        for (let question of data.questions['questions']) {
            var new_input = "<input type='text' class='questions' value='" + question +"'>";
            $("#inputs").append(new_input);
        }
        $("#assignmentQuestions").show();

        // var resultHTML = "<table><tr><td>_id</td><td>userid</td><td>assignmentid</td><td>question</td></tr>";
        // data.questions.forEach(function (question, index) {
        //     //console.log(question.userid);
        //     resultHTML += ("<tr><td><button val='"+question._id+"'>"+question._id+"</button</td><td>"+question.userid+"</td><td>"
        //     +question.assignmentid+"</td><td>"+question.question+"</td></tr>");
        // });

        // resultHTML += ("</table>");
        // resultDiv.innerHTML = resultHTML;
    });

    socket.on('addQuestionResponse', (data) => {
        console.log("Response received: " + data);
        resultDiv.innerHTML = "<p>Response received: " + data.success + "</p>";
    })

})();