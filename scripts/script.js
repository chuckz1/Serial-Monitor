// JavaScript source code

"use strict";

let port;
let reader;
let inputDone;
let outputDone;
let inputStream;
let outputStream;


const baudRate = document.getElementById("baudRateField");
const butConnect = document.getElementById("connect");
const log = document.getElementById("log");
const asd = document.getElementById("messageBox");


document.addEventListener("DOMContentLoaded", () => {
    //listen for button click
    asd.addEventListener("onkeydown", sendHistory);
    butConnect.addEventListener("click", clickConnect);
    

    //check if serial is supported
    const notSupported = document.getElementById("notSupported");
    notSupported.classList.toggle("hidden", "serial" in navigator);
});

//creates a serial connection
async function connect() {
    //ask user to select a port
    port = await navigator.serial.requestPort();
    //open port async with 9600 baudrate
    try {
        await port.open({ baudRate: baudRate.value });
    } catch (err) {
        console.error(err);

        //display failed
        writeError(err);
        return;
    }

    //create out stream
    const encoder = new TextEncoderStream();
    outputDone = encoder.readable.pipeTo(port.writable);
    outputStream = encoder.writable;

    //used to stop echoing?
    writeToStream("\x03", "echo(false);");

    //set up input stream
    let decoder = new TextDecoderStream();
    inputDone = port.readable.pipeTo(decoder.writable);
    inputStream = decoder.readable.pipeThrough(
        new TransformStream(new LineBreakTransformer())
    );

    //create reader object that monitors the stream
    reader = inputStream.getReader();
    readLoop();
}
var mess;
//closes a connected serial port
async function disconnect() {
    //close reader object monitoring the stream
    if (reader) {
        await reader.cancel();
        await inputDone.catch(() => { });
        reader = null;
        inputDone = null;
    }

    //close the output stream
    if (outputStream) {
        await outputStream.getWriter().close();
        await outputDone;
        outputStream = null;
        outputDone = null;
    }

    //close the port
    try {
        await port.close();
    } catch (err) {
        console.error(err);

        //display failed closing
        writeError(err);
    }
    
    port = null;
}

//when connect button is pressed
async function clickConnect() {
    //disconnect
    if (port) {
        await disconnect();
        butConnect.textContent = "Connect";
        return;
    }

    //connect
    await connect();

    //toggle what the button displays
    butConnect.textContent = "Disconnect";
}

//loop that gets incoming serial data from the reader object
async function readLoop() {
    while (true) {
        const { value, done } = await reader.read();
        if (value) {
            writeToLog("\n" + value);
            
        }
        if (done) {
            console.log("[readLoop] DONE", done);
            reader.releaseLock();
            break;
        }
    }
}

//this is the reader class
class LineBreakTransformer {
    constructor() {
        // A container for holding stream data until a new line.
        this.container = "";
    }

    transform(chunk, controller) {
        this.container += chunk;
        const lines = this.container.split("\r\n");
        this.container = lines.pop();
        lines.forEach((line) => controller.enqueue(line));
    }

    flush(controller) {
        controller.enqueue(this.container);
    }
}