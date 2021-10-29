/**
 * @author Kamal Kant
 * @date OCT-28-2021
 * 
 * @description record or upload audio to server with silence detection 
 * 
 * Recorder src : https://github.com/muaz-khan/RecordRTC/tree/master/simple-demos
 * Scripts Requires :
 * 1. RecordRTC.js
 * 2. hark.js
 */


// get html elements 
var selected_language = document.getElementById("select_lang");
var asr_text = document.getElementById("asr_text");
var status_text = document.getElementById("status");
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");

recordButton.addEventListener("click", startRecording);

stopButton.addEventListener("click", stopRecording);

//added the paused functionality (not in the origional script)
pauseButton.addEventListener("click", pauseRecording);


function capturemic(callback) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function (mic) {
        callback(mic);
    }).catch(function (error) {
        alert('Unable to capture your Recording');
        console.error(error);
    });
}

function stopRecordingCallback() {
    // video.srcObject = null;
    var blob = recorder.getBlob();
    // video.src = URL.createObjectURL(blob);

    recorder.mic.stop();
    // video.muted = false;

    renderAudio(blob);

    // to stop the hark.js; so can reuse the hark.js
    // used for multiple recordings
    window.stop();
}

var recorder; // globally accessible
var isPaused = false;

function startRecording() {
    this.disabled = true;
    status_text.innerHTML = "SPEAK...";
    capturemic(function (mic) {
        // video.muted = true;
        // video.srcObject = mic;

        //recording params
        recorder = RecordRTC(mic, {
            type: 'audio',
            desiredSampRate: 8000,
            numberOfAudioChannels: 1,
            recorderType: StereoAudioRecorder
        });

        recorder.startRecording();

        // CHANGE THIS increase/decrease duration
        var max_seconds = 2;
        var stopped_speaking_timeout;
        var speechEvents = hark(mic, {});

        // speechEvents.on('volume_change', function () {
        //     console.log("change in vol");
        // });

        speechEvents.on('speaking', function () {
            if (recorder.getBlob()) return;

            clearTimeout(stopped_speaking_timeout);


            if (recorder.getState() === 'paused') {
                clearTimeout(stopped_speaking_timeout);
                status_text.innerHTML = "PAUSED!";
            }

            if (recorder.getState() === 'recording') {
                status_text.innerHTML = "RECORDING...";
            }
        });


        speechEvents.on('stopped_speaking', function () {
            if (recorder.getBlob()) return;

            // recorder.pauseRecording();
            if (recorder.getState() === 'paused') {
                clearTimeout(stopped_speaking_timeout);
                status_text.innerHTML = "PAUSED!";
            } else {
                stopped_speaking_timeout = setTimeout(function () {
                    stopButton.click(stopped_speaking_timeout);
                    status_text.innerHTML = 'STOPPED!';
                }, max_seconds * 1000);

                // just for logging purpose (you ca remove below code)
                var seconds = max_seconds;
                (function looper() {
                    status_text.innerHTML = 'STOPPING in ' + seconds + 's';
                    seconds--;

                    if (isPaused) {
                        clearTimeout(stopped_speaking_timeout);
                        status_text.innerHTML = 'PAUSED!';
                        return;
                    }

                    if (seconds <= 0) {
                        // status_text.innerHTML = "...";
                        return;
                    }

                    setTimeout(looper, 1000);
                })();
            }
        });

        // release mic on stopRecording
        recorder.mic = mic;

        stopButton.disabled = false;
        pauseButton.disabled = false;
    });
}

function pauseRecording() {
    if (recorder.getState() === 'recording') {
        recorder.pauseRecording();
        pauseButton.innerHTML = "Resume";
        console.log("**Paused pressed**");
        status_text.innerHTML = "PAUSED!";
        isPaused = true;
    } else {
        recorder.resumeRecording();
        pauseButton.innerHTML = "Pause";
        console.log("**Resume pressed**");
        status_text.innerHTML = "SPEAK...";
        isPaused = false;
    }
}

function stopRecording() {
    this.disabled = true;
    pauseButton.disabled = true;
    recordButton.disabled = false;
    isPaused = false;
    status_text.innerHTML = 'STOPPED!';
    recorder.stopRecording(stopRecordingCallback);
    // window.stop();
}

function getDateTime() {
    var currentdate = new Date();
    var datetime = "Rec_" + currentdate.getDate() + "-"
        + (currentdate.getMonth() + 1) + "-"
        + currentdate.getFullYear() + "_"
        + currentdate.getHours() + ":"
        + currentdate.getMinutes() + ":"
        + currentdate.getSeconds();
    return datetime;
}

function renderAudio(blob) {
    var url = URL.createObjectURL(blob);
    var au = document.createElement('audio');
    var br = document.createElement('br');
    var li = document.createElement('li');
    li.className = "list-group-item";

    au.controls = true;
    au.src = url;

    li.appendChild(au);
    li.appendChild(br);

    var filename = getDateTime() + ".wav"

    li.appendChild(document.createTextNode(filename))

    uploadFile(blob, filename)

    recordingsList.appendChild(li);
}


// choose file option
function processFile() {
    var sound = fileupload.files[0];
    if (sound == null) {
        alert("Please choose the audio file")
        return;
    }
    file_loc = sound.name;
    console.log(file_loc)
    var file_ext = file_loc.split('.').pop();

    //check the file type
    if (file_ext === 'mp3' || file_ext === 'wav') {
        file_name = getDateTime() + "." + file_ext
        uploadFile(sound, file_name);
    } else {
        console.log("wrong file extension")
        alert("Please choose the right audio file")
        return;
    }
}

/**
 * upload file to the server
 * @param {blob} sound audio
 * @param {string} file_name date_time
 */
function uploadFile(sound, file_name) {
    var language = selected_language.value;

    const formData = new FormData();
    formData.append("language", language)
    formData.append("sound", sound)
    formData.append("filename", file_name)
    // var oOutput = document.getElementById("status")
    var oReq = new XMLHttpRequest();
    oReq.open("POST", "recognize", true);
    oReq.onload = function (oEvent) {
        if (oReq.status == 200) {
            status_text.innerHTML = "Uploaded!";
            console.log(oReq.response)
            asr_text.value = oReq.response
        } else {
            status_text.innerHTML = "Error occurred when trying to upload your file.<br \/>";
        }
    };
    status_text.innerHTML = "Sending file!";
    console.log("Sending file!")
    oReq.send(formData);
}
