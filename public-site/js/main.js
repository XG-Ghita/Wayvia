// ==========================================
// CAREER JOURNEY - VIDEO CONTROLLER
// ==========================================


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const videoA = document.getElementById("videoA");
const videoB = document.getElementById("videoB");

const startButton = document.getElementById("startSearch");
const heroContent = document.getElementById("heroContent");
const landing = document.querySelector(".landing");
const loading = document.getElementById("loading");


// ==========================================
// VIDEO FILES
// ==========================================

const scene1 = "../assets/videos/scene1.mp4";
const scene2Main = "../assets/videos/scene2-main.mp4";
const scene3 = "../assets/videos/scene3.mp4";


// ==========================================
// SETTINGS
// ==========================================

const IDLE_DURATION = 1.25;
const IDLE_SPEED = 0.3;


// ==========================================
// STATE
// ==========================================

let currentScene = "";
let transitionStarted = false;
let idleMode = false;

let activeVideo = videoA;
let inactiveVideo = videoB;


// ==========================================
// VIDEO SETUP
// ==========================================

function setupVideo(video) {

    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.loop = false;
    video.playbackRate = 1;

}

setupVideo(videoA);
setupVideo(videoB);


// ==========================================
// INITIAL STATE
// ==========================================

heroContent.style.opacity = "0";


// ==========================================
// HIDE LOADING
// ==========================================

function hideLoading() {

    if (loading) {
        loading.classList.add("hidden");
    }

}


// ==========================================
// PLAY VIDEO
// ==========================================

function playVideo(video) {

    video.play().catch(function(error) {

        console.log(
            "Video waiting for interaction:",
            error
        );

    });

}


// ==========================================
// SWITCH VIDEO LAYERS
// ==========================================

function switchVideos() {

    activeVideo.classList.remove("active");
    inactiveVideo.classList.add("active");

    const oldVideo = activeVideo;

    activeVideo = inactiveVideo;
    inactiveVideo = oldVideo;

}


// ==========================================
// SCENE 1
// ==========================================

function playScene1() {

    currentScene = "scene1";
    idleMode = false;

    activeVideo = videoA;
    inactiveVideo = videoB;

    videoA.classList.add("active");
    videoB.classList.remove("active");

    videoA.pause();
    videoB.pause();

    videoA.playbackRate = 1;
    videoA.loop = false;

    videoA.src = scene1;
    videoA.load();

    videoA.onloadeddata = function() {

        hideLoading();

        videoA.playbackRate = 1;

        playVideo(videoA);

        preloadScene2();

    };

}


// ==========================================
// PRELOAD SCENE 2
// ==========================================

function preloadScene2() {

    videoB.src = scene2Main;

    videoB.preload = "auto";

    videoB.load();

}


// ==========================================
// SCENE 2 MAIN
// ==========================================

function playScene2Main() {

    currentScene = "scene2-main";
    idleMode = false;

    const nextVideo = inactiveVideo;

    nextVideo.pause();

    nextVideo.loop = false;

    nextVideo.playbackRate = 1;

    nextVideo.currentTime = 0;


    function startScene2() {

        nextVideo.playbackRate = 1;

        showInterface();

        playVideo(nextVideo);

        // Wait one frame before switching
        // so Scene 2 is already visible.

        requestAnimationFrame(function() {

            requestAnimationFrame(function() {

                switchVideos();

            });

        });

    }


    // Scene 2 is already loaded

    if (nextVideo.readyState >= 3) {

        startScene2();

    } else {

        nextVideo.onloadeddata = function() {

            startScene2();

        };

        nextVideo.load();

    }

}


// ==========================================
// SHOW TEXT + BUTTON
// ==========================================

function showInterface() {

    heroContent.style.transition =
        "opacity 1s ease, transform 1s ease";

    heroContent.style.opacity = "1";

    heroContent.style.transform =
        "translateY(-50%)";

}


// ==========================================
// IDLE MODE
// ==========================================

function startIdleMode() {

    if (transitionStarted) {
        return;
    }

    currentScene = "scene2-idle";
    idleMode = true;

    activeVideo.loop = false;

    // Slow motion
    activeVideo.playbackRate = IDLE_SPEED;

    // Start at the final 1.25 seconds
    const idleStart = Math.max(
        0,
        activeVideo.duration - IDLE_DURATION
    );

    activeVideo.currentTime = idleStart;

    playVideo(activeVideo);

}


// ==========================================
// SEAMLESS IDLE LOOP
// ==========================================

function handleIdleLoop() {

    if (
        currentScene === "scene2-idle" &&
        idleMode
    ) {

        const idleStart = Math.max(
            0,
            activeVideo.duration - IDLE_DURATION
        );

        if (
            activeVideo.currentTime >=
            activeVideo.duration - 0.03
        ) {

            activeVideo.currentTime = idleStart;

        }

    }

}


videoA.addEventListener(
    "timeupdate",
    handleIdleLoop
);

videoB.addEventListener(
    "timeupdate",
    handleIdleLoop
);


// ==========================================
// SCENE 3
// ==========================================

function playScene3() {

    if (transitionStarted) {
        return;
    }

    transitionStarted = true;
    idleMode = false;
    currentScene = "scene3";

    landing.classList.add("transitioning");

    const nextVideo = inactiveVideo;

    nextVideo.pause();

    nextVideo.loop = false;

    nextVideo.playbackRate = 1;

    nextVideo.src = scene3;

    nextVideo.load();


    nextVideo.onloadeddata = function() {

        nextVideo.currentTime = 0;

        nextVideo.playbackRate = 1;

        playVideo(nextVideo);

        requestAnimationFrame(function() {

            requestAnimationFrame(function() {

                switchVideos();

            });

        });

    };

}


// ==========================================
// VIDEO ENDED
// ==========================================

function handleVideoEnded(event) {

    const finishedVideo = event.target;


    // ------------------------------------------
    // SCENE 1 FINISHED
    // ------------------------------------------

    if (
        currentScene === "scene1" &&
        finishedVideo === activeVideo
    ) {

        playScene2Main();

        return;

    }


    // ------------------------------------------
    // SCENE 2 MAIN FINISHED
    // ------------------------------------------

    if (
        currentScene === "scene2-main" &&
        finishedVideo === activeVideo
    ) {

        startIdleMode();

        return;

    }


    // ------------------------------------------
    // SCENE 3 FINISHED
    // ------------------------------------------

    if (
        currentScene === "scene3" &&
        finishedVideo === activeVideo
    ) {

        setTimeout(function() {

            window.location.href = "search.html";

        }, 150);

    }

}


videoA.addEventListener(
    "ended",
    handleVideoEnded
);

videoB.addEventListener(
    "ended",
    handleVideoEnded
);


// ==========================================
// START SEARCH BUTTON
// ==========================================

startButton.addEventListener(
    "click",
    function() {

        playScene3();

    }
);


// ==========================================
// KEYBOARD ACCESSIBILITY
// ==========================================

startButton.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter" ||
            event.key === " "
        ) {

            event.preventDefault();

            playScene3();

        }

    }
);


// ==========================================
// START WEBSITE
// ==========================================

playScene1();