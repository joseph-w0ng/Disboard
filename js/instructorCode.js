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
        var new_input = "<input type='text' class='questions'><br>";
        $("#inputs").append(new_input);
    });

    $("#submitQuestions").click(() => {
        let questions = [];
        $(".questions").each(function(i, question) {
            if ($(question).val().length > 0) {
                questions.push($(question).val());
            }
        });
        userId = $("#userId").val();
        assignmentId = $("#assignmentId").val();
        let info = {
            "userid": userId, //#aTODO: Add entry box
            "assignmentid": assignmentId, //#TODO: Add entry box
            "questions": questions,
        }
        resultDiv.innerHTML = "<p>Response received: </p>";
        console.log(info);
        socket.emit("addQuestions", info);
    });

    socket.on('getQuestionsResponse', (data) => {
        $("#inputs").empty();
        $("#assignmentDescription").empty();
       

        if (data.questions == null || data.questions['questions'].length <= 0) {
            var new_input = "Assignment not found. Time to make a new one!<br/>"
            $("#inputs").append(new_input);
        } else {
            $("#assignmentDescription").append("Assignment questions for: "+userId+"'s "+ assignmentId+":");
            for (let question of data.questions['questions']) {
                var new_input = "<input type='text' class='questions' value='" + question + "'><br/>";
                $("#inputs").append(new_input);
            }
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
        console.log("Response received: " + data.success);
        resultDiv.innerHTML = "<p>Response received: " + data.success + "</p>";
    })

})();