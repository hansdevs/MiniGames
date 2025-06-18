document.addEventListener("DOMContentLoaded", () => {
  const muteButton = document.getElementById("muteButton")
  let backgroundMusic = null
  let isMuted = localStorage.getItem("coffeeShopMuted") === "true"
  const musicPath = "../lib/coffeeShop/3_CoffeeBeans.wav"

  function setupAudio() {
    try {
      backgroundMusic = new Audio(musicPath)
      backgroundMusic.loop = true
      backgroundMusic.volume = 0.1
    } catch (e) {
      console.error("Failed to initialize audio on welcome page:", e)
      return
    }

    updateMuteButton()
    if (!isMuted) {
      playAudio()
    }
  }

  function playAudio() {
    if (backgroundMusic && backgroundMusic.paused && audioContextAllowed()) {
      backgroundMusic.play().catch((error) => {
        console.log("Welcome page audio autoplay prevented:", error)
        document.body.addEventListener("click", firstPlay, { once: true })
        document.body.addEventListener("touchstart", firstPlay, { once: true })
      })
    }
  }

  let audioContextGlobal = null
  function audioContextAllowed() {
    if (audioContextGlobal && audioContextGlobal.state === "running") return true
    return false
  }

  function initGlobalAudioContext() {
    if (!audioContextGlobal) {
      try {
        audioContextGlobal = new (window.AudioContext || window.webkitAudioContext)()
        if (audioContextGlobal.state === "suspended") {
          audioContextGlobal.resume().then(() => {
            console.log("Global AudioContext resumed!")
            if (!isMuted && backgroundMusic) playAudio()
          })
        } else if (audioContextGlobal.state === "running") {
          if (!isMuted && backgroundMusic) playAudio()
        }
      } catch (e) {
        console.error("Could not create global AudioContext", e)
      }
    } else if (audioContextGlobal.state === "suspended") {
      audioContextGlobal.resume().then(() => {
        console.log("Global AudioContext resumed on interaction!")
        if (!isMuted && backgroundMusic) playAudio()
      })
    }
  }

  function firstPlay() {
    initGlobalAudioContext() 
    if (backgroundMusic && !isMuted && audioContextAllowed()) {
      backgroundMusic.play().catch((e) => console.error("Error playing after interaction", e))
    }
  }

  function updateMuteButton() {
    if (muteButton) {
      muteButton.textContent = isMuted ? "Unmute" : "Mute"
    }
  }

  if (muteButton) {
    muteButton.addEventListener("click", () => {
      initGlobalAudioContext() // Ensure context is active before toggling
      isMuted = !isMuted
      localStorage.setItem("coffeeShopMuted", isMuted)
      if (isMuted) {
        backgroundMusic?.pause()
      } else {
        playAudio()
      }
      updateMuteButton()
    })
  }

  setupAudio()
  document.body.addEventListener("click", initGlobalAudioContext, { once: true })
  document.body.addEventListener("touchstart", initGlobalAudioContext, { once: true })
})
