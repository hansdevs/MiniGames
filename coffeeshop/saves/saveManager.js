document.addEventListener("DOMContentLoaded", () => {
  const playerNameInput = document.getElementById("playerNameInput")
  const playerScoreInput = document.getElementById("playerScoreInput")
  const staffSelection = document.getElementById("staffSelection")
  const saveButton = document.getElementById("saveButton")
  const loadButton = document.getElementById("loadButton")
  const clearButton = document.getElementById("clearButton")
  const startGameButton = document.getElementById("startGameButton")
  const saveDataDisplay = document.getElementById("saveDataDisplay")

  // File handling elements
  const fileDropArea = document.getElementById("fileDropArea")
  const fileInput = document.getElementById("fileInput")
  const fileSelectButton = document.getElementById("fileSelectButton")
  const jsonPasteArea = document.getElementById("jsonPasteArea")
  const loadFromPasteButton = document.getElementById("loadFromPasteButton")

  const COFFEE_SHOP_SAVE_KEY = "coffeeShopGameSaveData"

  // Initialize staff selector
  function initStaffSelector() {
    const staffOptions = document.querySelectorAll(".staff-option")

    // Set default selection
    staffOptions[0].classList.add("selected")

    staffOptions.forEach((option) => {
      option.addEventListener("click", () => {
        // Remove selected class from all options
        staffOptions.forEach((opt) => opt.classList.remove("selected"))
        // Add selected class to clicked option
        option.classList.add("selected")
        // Update hidden input value
        staffSelection.value = option.dataset.staff
        updateStartGameButton()
      })
    })
  }

  // Function to check if we have valid player data and enable/disable Start Game button
  function updateStartGameButton() {
    const playerName = playerNameInput.value.trim()
    const hasValidData = playerName.length > 0

    if (startGameButton) {
      startGameButton.disabled = !hasValidData
    }
  }

  // Function to display messages or data
  function displayData(message, type = "info") {
    if (type === "json") {
      saveDataDisplay.innerHTML = `<pre>${JSON.stringify(message, null, 2)}</pre>`
    } else {
      saveDataDisplay.innerHTML = `<span class="${type}">${message}</span>`
    }
  }

  // Function to generate filename based on player name
  function generateFileName(playerName) {
    const namePrefix = playerName
      .substring(0, 5)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase()
    const saveCountKey = `saveCount_${namePrefix}`
    const saveCount = Number.parseInt(localStorage.getItem(saveCountKey) || "0", 10) + 1
    localStorage.setItem(saveCountKey, saveCount.toString())
    return `${namePrefix}${saveCount}.json`
  }

  // Function to download JSON file
  function downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Function to load save data into form
  function loadSaveIntoForm(saveData) {
    try {
      playerNameInput.value = saveData.playerName || ""
      playerScoreInput.value = saveData.playerScore || ""

      // Set staff selection
      if (saveData.staffType) {
        const staffOptions = document.querySelectorAll(".staff-option")
        staffOptions.forEach((opt) => opt.classList.remove("selected"))

        const selectedStaff = document.querySelector(`[data-staff="${saveData.staffType}"]`)
        if (selectedStaff) {
          selectedStaff.classList.add("selected")
          staffSelection.value = saveData.staffType
        }
      }

      // Save to session storage
      sessionStorage.setItem(COFFEE_SHOP_SAVE_KEY, JSON.stringify(saveData))

      displayData(saveData, "json")
      updateStartGameButton()
    } catch (e) {
      displayData("Error loading save data into form.", "error")
      console.error("Error loading save data:", e)
    }
  }

  // Function to validate JSON save data
  function validateSaveData(data) {
    return (
      data &&
      typeof data === "object" &&
      data.playerName &&
      typeof data.playerName === "string" &&
      data.hasOwnProperty("playerScore")
    )
  }

  // Function to save data and download JSON file
  function saveData() {
    const playerName = playerNameInput.value.trim()
    const playerScore = Number.parseInt(playerScoreInput.value, 10) || 0
    const selectedStaff = Number.parseInt(staffSelection.value, 10) || 1

    if (!playerName) {
      displayData("Player Name cannot be empty.", "error")
      return
    }

    const saveData = {
      playerName: playerName,
      playerScore: playerScore,
      staffType: selectedStaff,
      playerLevel: 1,
      wallet: 500.0,
      customersServed: 0,
      rating: 5.0,
      lastSaved: new Date().toISOString(),
      gameType: "coffeeShop",
      version: "1.0",
    }

    try {
      // Save to sessionStorage
      sessionStorage.setItem(COFFEE_SHOP_SAVE_KEY, JSON.stringify(saveData))

      // Generate filename and download JSON file
      const filename = generateFileName(playerName)
      downloadJSON(saveData, filename)

      displayData(`Save successful! File "${filename}" downloaded and stored in session.`, "success")
      updateStartGameButton()
    } catch (e) {
      displayData("Error saving data.", "error")
      console.error("Error saving data:", e)
    }
  }

  // Function to load data from sessionStorage
  function loadData() {
    const loadedDataString = sessionStorage.getItem(COFFEE_SHOP_SAVE_KEY)
    if (loadedDataString) {
      try {
        const loadedData = JSON.parse(loadedDataString)
        displayData(loadedData, "json")
        playerNameInput.value = loadedData.playerName || ""
        playerScoreInput.value = loadedData.playerScore || ""

        // Set staff selection
        if (loadedData.staffType) {
          const staffOptions = document.querySelectorAll(".staff-option")
          staffOptions.forEach((opt) => opt.classList.remove("selected"))

          const selectedStaff = document.querySelector(`[data-staff="${loadedData.staffType}"]`)
          if (selectedStaff) {
            selectedStaff.classList.add("selected")
            staffSelection.value = loadedData.staffType
          }
        }

        updateStartGameButton()
      } catch (e) {
        displayData("Error parsing saved data from session.", "error")
        console.error("Error parsing JSON from sessionStorage:", e)
      }
    } else {
      displayData("No save data found in this session.", "info")
    }
  }

  // Function to clear data
  function clearData() {
    sessionStorage.removeItem(COFFEE_SHOP_SAVE_KEY)
    displayData("Session save data cleared.", "success")
    playerNameInput.value = ""
    playerScoreInput.value = ""

    // Reset staff selection to default
    const staffOptions = document.querySelectorAll(".staff-option")
    staffOptions.forEach((opt) => opt.classList.remove("selected"))
    staffOptions[0].classList.add("selected")
    staffSelection.value = "1"

    updateStartGameButton()
  }

  // Function to start the game
  function startGame() {
    const playerName = playerNameInput.value.trim()
    if (!playerName) {
      displayData("Please enter a player name before starting the game.", "error")
      return
    }

    // Ensure current data is saved to session before starting game
    const playerScore = Number.parseInt(playerScoreInput.value, 10) || 0
    const selectedStaff = Number.parseInt(staffSelection.value, 10) || 1

    const saveData = {
      playerName: playerName,
      playerScore: playerScore,
      staffType: selectedStaff,
      playerLevel: 1,
      wallet: 500.0,
      customersServed: 0,
      rating: 5.0,
      lastSaved: new Date().toISOString(),
      gameType: "coffeeShop",
      version: "1.0",
    }

    sessionStorage.setItem(COFFEE_SHOP_SAVE_KEY, JSON.stringify(saveData))

    // Navigate to the coffee shop game
    window.location.href = "coffeeshopGame.html"
  }

  // Function to handle file reading
  function handleFile(file) {
    if (file && file.type === "application/json") {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target.result)
          if (validateSaveData(saveData)) {
            loadSaveIntoForm(saveData)
          } else {
            displayData("Invalid save file format. Missing required fields.", "error")
          }
        } catch (error) {
          displayData("Error reading JSON file. Please check the file format.", "error")
          console.error("JSON parse error:", error)
        }
      }
      reader.readAsText(file)
    } else {
      displayData("Please select a valid JSON file.", "error")
    }
  }

  // Function to load from pasted JSON
  function loadFromPaste() {
    const pastedData = jsonPasteArea.value.trim()
    if (!pastedData) {
      displayData("Please paste JSON data first.", "error")
      return
    }

    try {
      const saveData = JSON.parse(pastedData)
      if (validateSaveData(saveData)) {
        loadSaveIntoForm(saveData)
        jsonPasteArea.value = ""
      } else {
        displayData("Invalid JSON format. Missing required fields (playerName, playerScore).", "error")
      }
    } catch (error) {
      displayData("Invalid JSON format. Please check your pasted data.", "error")
      console.error("JSON parse error:", error)
    }
  }

  // Event Listeners
  if (saveButton) {
    saveButton.addEventListener("click", saveData)
  }
  if (loadButton) {
    loadButton.addEventListener("click", loadData)
  }
  if (clearButton) {
    clearButton.addEventListener("click", clearData)
  }
  if (startGameButton) {
    startGameButton.addEventListener("click", startGame)
  }

  // Input change listeners
  if (playerNameInput) {
    playerNameInput.addEventListener("input", updateStartGameButton)
  }
  if (playerScoreInput) {
    playerScoreInput.addEventListener("input", updateStartGameButton)
  }

  // File handling event listeners
  if (fileSelectButton) {
    fileSelectButton.addEventListener("click", () => fileInput.click())
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0])
      }
    })
  }

  if (fileDropArea) {
    fileDropArea.addEventListener("dragover", (e) => {
      e.preventDefault()
      fileDropArea.classList.add("drag-over")
    })

    fileDropArea.addEventListener("dragleave", (e) => {
      e.preventDefault()
      fileDropArea.classList.remove("drag-over")
    })

    fileDropArea.addEventListener("drop", (e) => {
      e.preventDefault()
      fileDropArea.classList.remove("drag-over")

      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0])
      }
    })

    fileDropArea.addEventListener("click", () => fileInput.click())
  }

  if (loadFromPasteButton) {
    loadFromPasteButton.addEventListener("click", loadFromPaste)
  }

  // Initialize
  initStaffSelector()
  displayData("Enter player details and save. Load to retrieve.", "info")
  updateStartGameButton()
})
