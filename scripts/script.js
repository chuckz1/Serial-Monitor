"use strict";

// Variables for serial communication
let port;
let reader;
let inputDone;
let outputDone;
let inputStream;
let outputStream;

// References to DOM elements
const baudRate = document.getElementById("baudRateField");
const butConnect = document.getElementById("connect");
const log = document.getElementById("log");
const messageBox = document.getElementById("messageBox");

document.addEventListener("DOMContentLoaded", () => {
	// Event listener for the connect button
	butConnect.addEventListener("click", clickConnect);

	// Check for Web Serial API support
	const notSupported = document.getElementById("notSupported");
	notSupported.classList.toggle("hidden", "serial" in navigator);

	// Load settings from URL
	loadSettingsFromURL();
});

// Function to establish a serial connection
async function connect() {
	// Prompt the user to select a serial port
	port = await navigator.serial.requestPort();

	// Open the selected port with the specified baud rate
	try {
		await port.open({ baudRate: baudRate.value });
	} catch (err) {
		console.error(err);
		// Display an error message if the connection fails
		writeError(err);
		return;
	}

	// Initialize the output stream
	const encoder = new TextEncoderStream();
	outputDone = encoder.readable.pipeTo(port.writable);
	outputStream = encoder.writable;

	// Send initial commands to the device (specific to your device)
	writeToStream("\x03", "echo(false);");

	// Initialize the input stream
	let decoder = new TextDecoderStream();
	inputDone = port.readable.pipeTo(decoder.writable);
	inputStream = decoder.readable.pipeThrough(
		new TransformStream(new LineBreakTransformer())
	);

	// Create a reader to read incoming data
	reader = inputStream.getReader();
	readLoop();
}

// Function to disconnect from the serial port
async function disconnect() {
	// Close the reader
	if (reader) {
		await reader.cancel();
		await inputDone.catch(() => {});
		reader = null;
		inputDone = null;
	}

	// Close the output stream
	if (outputStream) {
		await outputStream.getWriter().close();
		await outputDone;
		outputStream = null;
		outputDone = null;
	}

	// Close the serial port
	try {
		await port.close();
	} catch (err) {
		console.error(err);
		// Display an error message if disconnection fails
		writeError(err);
	}

	port = null;
}

// Event handler for the connect/disconnect button
async function clickConnect() {
	if (port) {
		// If already connected, disconnect
		await disconnect();
		butConnect.textContent = "Connect";
		return;
	}
	// If not connected, establish a connection
	await connect();
	butConnect.textContent = "Disconnect";
}

// Function to continuously read from the serial port
async function readLoop() {
	while (true) {
		const { value, done } = await reader.read();
		if (value) {
			// Write the incoming data to the log
			writeToLog("\n" + value);
		}
		if (done) {
			console.log("[readLoop] DONE", done);
			reader.releaseLock();
			break;
		}
	}
}

// Transformer class to process incoming data line by line
class LineBreakTransformer {
	constructor() {
		// Container for accumulating incoming data
		this.container = "";
	}

	transform(chunk, controller) {
		this.container += chunk;
		const lines = this.container.split("\r\n");
		this.container = lines.pop();
		lines.forEach((line) => controller.enqueue(line));
	}

	flush(controller) {
		// Enqueue any remaining data when the stream is closed
		controller.enqueue(this.container);
	}
}
