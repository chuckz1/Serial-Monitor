// JavaScript source code

"use strict";

let autoScroll;
let endingType;
let timeStamp;


//events called when ui is changed
function setBaudRate() {
    baudRate.value = document.getElementById("baudSelect").value;
}
setBaudRate();

function setAutoScroll() {
    autoScroll = document.getElementById("scroll").checked;
}
setAutoScroll();

//sets the ending type of out messages
function setEndingType() {
    endingType = document.getElementById("sendEnding").value;
}
setEndingType();

//addes time stamps to new messages
function setTimeStamp() {
    timeStamp = document.getElementById("time").checked;
}
setTimeStamp();

//scrolls the log to the bottom
function logToBottom() {
    document.getElementById("log").scrollTop = document.getElementById("log").scrollHeight;
}

//writes text to the log
function writeToLog(value) {

    if (timeStamp) {
        let today = new Date();
        log.textContent += today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
        log.textContent += ":" + today.getMinutes() + ":" + today.getSeconds() + "." + today.getMilliseconds() + " -> ";
    }

    log.textContent += value;

    if (autoScroll) {
        logToBottom();
    }
}

//send data to arduino (takes a string)
function writeToStream(...lines) {
    const writer = outputStream.getWriter();
    lines.forEach((line) => {
        console.log("[SEND]", line);

        writer.write(line + "\n");
    });
    writer.releaseLock();
}

//sends message from message box
function sendMessage() {
    //writeToStream(document.getElementById("messageBox").value);

    if (writeCustomToStream(document.getElementById("messageBox").value)) {
        addSendHistory(document.getElementById("messageBox").value);
    }

    function writeCustomToStream(...lines) {
        try {
            const writer = outputStream.getWriter();
        
            lines.forEach((line) => {
                console.log("[SEND]", line);

                switch (parseInt(endingType)) {
                    case 0:
                        writer.write(line);
                        break;
                    case 1:
                        writer.write(line + "\n");
                        break;
                    case 2:
                        writer.write(line + "\r");
                        break;
                    case 3:
                        writer.write(line + "\r\n");
                        break;
                    default:
                        console.error("Invalid line ending type");
                        writeError("Invalid line ending type");
                }
            });

            writer.releaseLock();
        } catch (err) {
            console.error(err);

            writeError("Could not find anything to send message to: (" + err + ")");
            return false;
        }
        return true;
    }
    
    return false;
}

function clearLog() {
    log.textContent = "";
}
const errorLogtracker = [];

async function writeError(error) {

    //display message
    errorLogtracker.push(new ErrorMessage(error));
    updateErrorLog();

    //timer to clear message
    await new Promise(r => setTimeout(r, 10000));
    clearErrorLog();
}

//clears one message from the error log
function clearErrorLog() {
    //clear oldest message
    if (errorLogtracker && errorLogtracker.length > 0) {
        errorLogtracker.shift();
    }

    updateErrorLog();
}

function updateErrorLog() {
    //get the log
    let eLog = document.getElementById("error log");

    //clear the log
    eLog.innerHTML = "";

    //check if the log is empty
    if (errorLogtracker.length > 0) {
        eLog.classList.remove("hidden");
        //rewrite the error log
        for (var i = 0; i < errorLogtracker.length; i++) {
            eLog.innerHTML += errorLogtracker[i].message;
            eLog.innerHTML += "<hr>";
        }
    } else {
        eLog.classList.add("hidden");
    }
}

updateErrorLog();

let sendHistory = [];
let sendHistoryIndex = 0;

//this is the reader class
class ErrorMessage {
    constructor(_message) {
        // A container for holding stream data until a new line.
        this.message = _message;
    }
}

function addSendHistory(newMessage) {
    sendHistory.push(newMessage);
    sendHistoryIndex = sendHistory.length;
}

function getSendHistory(e) {
    if (sendHistory.length > 0) {
        if (e.key == "ArrowUp") {
            sendHistoryIndex--;
            if (sendHistoryIndex < 0) {
                //reached end of history
                sendHistoryIndex = 0;
                return;
            }
        } else if (e.key == "ArrowDown") {
            sendHistoryIndex++;
            if (sendHistoryIndex >= sendHistory.length) {
                //reached begining of history
                sendHistoryIndex = sendHistory.length;
                document.getElementById("messageBox").value = "";
                return;
            }
        } else {
            return;
        }

        document.getElementById("messageBox").value = sendHistory[sendHistoryIndex];
    }
}