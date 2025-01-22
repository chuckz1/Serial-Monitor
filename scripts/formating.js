"use strict";

// Variables to hold UI settings
let autoScroll;
let endingType;
let timeStamp;

// Checks if a dropdown has a specific value
function checkDropdownHasValue(dropdown, value) {
	return document.querySelector(`#${dropdown} option[value="${value}"]`);
}

// Function to set the baud rate from the selection
function setBaudRateDropdown(updateUrl = true) {
	document.getElementById("baudRateField").value =
		document.getElementById("baudSelect").value;

	setCustomBaudRate(updateUrl);
}

function setCustomBaudRate(updateUrl = true) {
	let customBaud = document.getElementById("baudRateField").value;
	baudRate.value = customBaud;

	// Update dropdown to display custom baud rate
	document.getElementById("baudSelect").value = customBaud;

	if (updateUrl) {
		// Update URL parameter with the custom baud rate
		updateURLParameter("baud", customBaud);
	}
}

// Function to set the auto-scroll preference
function setAutoScroll() {
	autoScroll = document.getElementById("scroll").checked;

	// Update URL parameter
	updateURLParameter("autoscroll", autoScroll);
}

// Function to set the line ending type for outgoing messages
function setEndingType() {
	endingType = document.getElementById("sendEnding").value;

	// Update URL parameter
	updateURLParameter("lineending", endingType);
}

// Function to set the timestamp preference
function setTimeStamp() {
	timeStamp = document.getElementById("time").checked;

	// Update URL parameter
	updateURLParameter("timestamp", timeStamp);
}

// Function to scroll the log to the bottom
function logToBottom() {
	document.getElementById("log").scrollTop =
		document.getElementById("log").scrollHeight;
}

// Function to write text to the log area
function writeToLog(value) {
	if (timeStamp) {
		let today = new Date();
		let timeText = "";
		// Format the time string
		timeText +=
			today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
		timeText +=
			":" +
			today.getMinutes() +
			":" +
			today.getSeconds() +
			"." +
			today.getMilliseconds() +
			" -> ";
		// Replace all new lines with timestamped lines
		value = value.replace(/\r\n|\n/g, "\n" + timeText);
	}

	// Append the value to the log
	log.textContent += value;

	// Auto-scroll if enabled
	if (autoScroll) {
		logToBottom();
	}
}

// Function to send data to the serial device
function writeToStream(...lines) {
	const writer = outputStream.getWriter();
	lines.forEach((line) => {
		console.log("[SEND]", line);
		writer.write(line + "\n");
	});
	writer.releaseLock();
}

// Function to send a message from the message box
function sendMessage() {
	if (writeCustomToStream(document.getElementById("messageBox").value)) {
		// Add message to history after sending
		addSendHistory(document.getElementById("messageBox").value);
		// Clear the message box
		document.getElementById("messageBox").value = "";
	}

	// Internal function to handle custom line endings
	function writeCustomToStream(...lines) {
		try {
			const writer = outputStream.getWriter();
			lines.forEach((line) => {
				console.log("[SEND]", line);
				// Determine the line ending based on user selection
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

// Function to clear the log area
function clearLog() {
	log.textContent = "";
}

// Array to track error messages
const errorLogtracker = [];

// Function to display error messages
async function writeError(error) {
	// Add the error to the tracker
	errorLogtracker.push(new ErrorMessage(error));
	updateErrorLog();

	// Remove the error after 10 seconds
	await new Promise((r) => setTimeout(r, 10000));
	clearErrorLog();
}

// Function to clear the oldest error message
function clearErrorLog() {
	if (errorLogtracker && errorLogtracker.length > 0) {
		errorLogtracker.shift();
	}
	updateErrorLog();
}

// Function to update the error log display
function updateErrorLog() {
	let eLog = document.getElementById("error log");
	eLog.innerHTML = "";

	if (errorLogtracker.length > 0) {
		eLog.classList.remove("hidden");
		// Display all error messages
		for (let i = 0; i < errorLogtracker.length; i++) {
			eLog.innerHTML += errorLogtracker[i].message;
			eLog.innerHTML += "<hr>";
		}
	} else {
		eLog.classList.add("hidden");
	}
}
updateErrorLog(); // Initialize error log on page load

// Variables for managing send history
let sendHistory = [];
let sendHistoryIndex = 0;

// Class to represent an error message
class ErrorMessage {
	constructor(_message) {
		this.message = _message;
	}
}

// Function to add a message to the send history
function addSendHistory(newMessage) {
	sendHistory.push(newMessage);
	sendHistoryIndex = sendHistory.length;
}

// Function to navigate send history using arrow keys
function getSendHistory(e) {
	if (sendHistory.length > 0) {
		if (e.key == "ArrowUp") {
			sendHistoryIndex--;
			if (sendHistoryIndex < 0) {
				sendHistoryIndex = 0;
				return;
			}
		} else if (e.key == "ArrowDown") {
			sendHistoryIndex++;
			if (sendHistoryIndex >= sendHistory.length) {
				sendHistoryIndex = sendHistory.length;
				document.getElementById("messageBox").value = "";
				return;
			}
		} else {
			return;
		}
		// Update the message box with the history item
		document.getElementById("messageBox").value = sendHistory[sendHistoryIndex];
	}
}
