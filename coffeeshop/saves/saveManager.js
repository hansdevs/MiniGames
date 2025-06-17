document.addEventListener("DOMContentLoaded", () => {
  const playerNameInput = document.getElementById("playerNameInput")
  const shopNameInput = document.getElementById("shopNameInput")
  const staffOptions = document.querySelectorAll(".staff-option")
  const staffSelectionIdInput = document.getElementById("staffSelectionId")
  const staffSelectionImgInput = document.getElementById("staffSelectionImg")

  const newGameButton = document.getElementById("newGameButton")
  const loadFromSessionButton = document.getElementById("loadFromSessionButton")
  const downloadSaveButton = document.getElementById("downloadSaveButton")
  const fileInput = document.getElementById("fileInput")
  const fileSelectButton = document.getElementById("fileSelectButton")
  const fileDropArea = document.getElementById("fileDropArea")
  const jsonPasteArea = document.getElementById("jsonPasteArea")
  const loadFromPasteButton = document.getElementById("loadFromPasteButton")
  const clearSessionButton = document.getElementById("clearSessionButton")
  const saveDataDisplay = document.getElementById("saveDataDisplay")

  const SAVE_KEY = "coffeeShopGameSaveData_v3" // Updated key for new structure

  const allStaffTypes = [
    { id: "barista", name: "Classic Barista", img: "../images/barista.png" },
    { id: "broista", name: "Cool Broista", img: "../images/broista.png" },
    { id: "non-binary", name: "Modern Barista", img: "../images/non-binary.png" },
  ]
  let selectedStaffId = allStaffTypes[0].id
  let selectedStaffImg = allStaffTypes[0].img

  staffOptions.forEach((option) => {
    option.addEventListener("click", () => {
      staffOptions.forEach((opt) => opt.classList.remove("selected"))
      option.classList.add("selected")
      selectedStaffId = option.dataset.staffId
      selectedStaffImg = option.dataset.staffImg
      staffSelectionIdInput.value = selectedStaffId
      staffSelectionImgInput.value = selectedStaffImg
    })
  })

  function displayMessage(message, type = "info") {
    saveDataDisplay.innerHTML = `<span class="${type}">${message}</span>`
    if (type === "json") {
      saveDataDisplay.innerHTML = `<pre>${JSON.stringify(message, null, 2)}</pre>`
    }
  }

  function createDefaultSaveData() {
    const playerName = playerNameInput.value.trim() || "Pat Barista"
    const shopName = shopNameInput.value.trim() || "The Daily Grind"

    const unusedStaff = allStaffTypes.filter((staff) => staff.id !== selectedStaffId)

    return {
      playerName: playerName,
      shopName: shopName,
      playerStaff: { id: selectedStaffId, img: selectedStaffImg },
      availableAssistants: unusedStaff, // Store other character models
      hiredAssistant: null, // No assistant hired initially
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      wallet: 500,
      rating: 5.0, // Initial rating
      day: 1,
      currentTime: 8 * 60, // 8:00 AM in minutes
      customersServedToday: 0,
      menuItems: [
        {
          id: "coffee-to-go",
          name: "Coffee To Go",
          price: 2.5,
          stock: 20,
          unlocked: true,
          img: "../images/Coffee-To-Go.png",
          prepTime: 5,
          challenge: "sequence",
        },
        {
          id: "croissant",
          name: "Croissant",
          price: 1.75,
          stock: 15,
          unlocked: false,
          img: "../images/Croissant.png",
          prepTime: 3,
          challenge: "timing",
        },
        {
          id: "coffee-cup",
          name: "Espresso",
          price: 3.0,
          stock: 10,
          unlocked: false,
          img: "../images/Coffee-Cup.png",
          prepTime: 7,
          challenge: "sequence",
        },
        {
          id: "sandwich",
          name: "Sandwich",
          price: 4.5,
          stock: 5,
          unlocked: false,
          img: "../images/Sandwich.png",
          prepTime: 10,
          challenge: "sequence",
        },
        {
          id: "chocolate-donut",
          name: "Chocolate Donut",
          price: 2.0,
          stock: 10,
          unlocked: false,
          img: "../images/Chocolate-donut.png",
          prepTime: 4,
          challenge: "timing",
        },
        {
          id: "frosted-blueberry-donut",
          name: "Blueberry Donut",
          price: 2.25,
          stock: 10,
          unlocked: false,
          img: "../images/Frosted-blueberry-donut.png",
          prepTime: 4,
          challenge: "timing",
        },
        {
          id: "chocolate-muffin",
          name: "Chocolate Muffin",
          price: 2.75,
          stock: 8,
          unlocked: false,
          img: "../images/Chocolate-muffin.png",
          prepTime: 6,
          challenge: "sequence",
        },
      ],
      upgrades: {
        espressoMachine: 1, // Level 1
        assistantHired: false,
      },
      dailyGoals: [
        { description: "Serve 5 customers", target: 5, current: 0, type: "serve", completed: false },
        { description: "Earn $50", target: 50, current: 0, type: "earn", completed: false },
      ],
      lastSaved: new Date().toISOString(),
      gameVersion: "3.0.0",
    }
  }

  function validateSaveData(data) {
    return (
      data && data.playerName && data.shopName && data.playerStaff && data.menuItems && data.gameVersion === "3.0.0"
    )
  }

  function loadSaveDataToForm(data) {
    if (!validateSaveData(data)) {
      displayMessage(
        "Invalid or outdated save data structure. Please start a new game or ensure the save is for version 3.0.0.",
        "error",
      )
      localStorage.removeItem(SAVE_KEY) // Clear invalid save
      return false
    }
    playerNameInput.value = data.playerName
    shopNameInput.value = data.shopName

    staffOptions.forEach((opt) => {
      opt.classList.toggle("selected", opt.dataset.staffId === data.playerStaff.id)
      if (opt.dataset.staffId === data.playerStaff.id) {
        selectedStaffId = data.playerStaff.id
        selectedStaffImg = data.playerStaff.img
        staffSelectionIdInput.value = selectedStaffId
        staffSelectionImgInput.value = selectedStaffImg
      }
    })
    displayMessage("Save data loaded into form. Ready to start game or modify.", "success")
    return true
  }

  function startGameWithData(saveData) {
    if (validateSaveData(saveData)) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
      window.location.href = "coffeeshopGame.html"
    } else {
      displayMessage("Cannot start game: Invalid save data. Please ensure it's for version 3.0.0.", "error")
    }
  }

  newGameButton.addEventListener("click", () => {
    const saveData = createDefaultSaveData()
    if (!playerNameInput.value.trim()) {
      displayMessage("Please enter a player name.", "error")
      playerNameInput.focus()
      return
    }
    if (!shopNameInput.value.trim()) {
      displayMessage("Please enter a shop name.", "error")
      shopNameInput.focus()
      return
    }
    displayMessage(saveData, "json")
    startGameWithData(saveData)
  })

  loadFromSessionButton.addEventListener("click", () => {
    const dataString = localStorage.getItem(SAVE_KEY)
    if (dataString) {
      try {
        const saveData = JSON.parse(dataString)
        if (loadSaveDataToForm(saveData)) {
          startGameWithData(saveData)
        }
      } catch (e) {
        displayMessage("Error parsing session data. Starting new game might be needed.", "error")
      }
    } else {
      displayMessage("No data in current session. Start a new game.", "info")
    }
  })

  downloadSaveButton.addEventListener("click", () => {
    const dataString = localStorage.getItem(SAVE_KEY)
    if (dataString) {
      try {
        const saveData = JSON.parse(dataString)
        const filename = `coffeeshop_${saveData.playerName.replace(/\s+/g, "_")}_v3_${new Date().toISOString().slice(0, 10)}.json`
        const blob = new Blob([dataString], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        displayMessage(`Save file "${filename}" downloaded.`, "success")
      } catch (e) {
        displayMessage("Error preparing download. Save data might be corrupted.", "error")
      }
    } else {
      displayMessage("No active session to download. Start or load a game first.", "info")
    }
  })

  fileSelectButton.addEventListener("click", () => fileInput.click())
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length) handleFile(e.target.files[0])
  })

  fileDropArea.addEventListener("dragover", (e) => {
    e.preventDefault()
    fileDropArea.classList.add("drag-over")
  })
  fileDropArea.addEventListener("dragleave", () => fileDropArea.classList.remove("drag-over"))
  fileDropArea.addEventListener("drop", (e) => {
    e.preventDefault()
    fileDropArea.classList.remove("drag-over")
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0])
  })

  function handleFile(file) {
    if (file && file.type === "application/json") {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target.result)
          if (loadSaveDataToForm(saveData)) {
            startGameWithData(saveData)
          }
        } catch (error) {
          displayMessage("Error reading or parsing JSON file.", "error")
        }
      }
      reader.readAsText(file)
    } else {
      displayMessage("Please select a valid JSON file.", "error")
    }
  }

  loadFromPasteButton.addEventListener("click", () => {
    const pastedJSON = jsonPasteArea.value.trim()
    if (!pastedJSON) {
      displayMessage("Paste area is empty.", "info")
      return
    }
    try {
      const saveData = JSON.parse(pastedJSON)
      if (loadSaveDataToForm(saveData)) {
        startGameWithData(saveData)
      }
    } catch (error) {
      displayMessage("Invalid JSON format. Please check your pasted data.", "error")
    }
  })

  clearSessionButton.addEventListener("click", () => {
    localStorage.removeItem(SAVE_KEY)
    playerNameInput.value = ""
    shopNameInput.value = ""
    staffOptions.forEach((opt) => opt.classList.remove("selected"))
    staffOptions[0].classList.add("selected")
    selectedStaffId = staffOptions[0].dataset.staffId
    selectedStaffImg = staffOptions[0].dataset.staffImg
    staffSelectionIdInput.value = selectedStaffId
    staffSelectionImgInput.value = selectedStaffImg
    displayMessage("Current session data cleared.", "success")
  })

  const existingDataString = localStorage.getItem(SAVE_KEY)
  if (existingDataString) {
    try {
      const existingSaveData = JSON.parse(existingDataString)
      if (validateSaveData(existingSaveData)) {
        loadSaveDataToForm(existingSaveData)
        displayMessage("Existing session data loaded. You can continue or start new.", "info")
      } else {
        localStorage.removeItem(SAVE_KEY) // Remove invalid or old version
        displayMessage("Old or invalid save data cleared. Please start a new game.", "info")
      }
    } catch (e) {
      localStorage.removeItem(SAVE_KEY) // Remove corrupted
      displayMessage("Corrupted save data cleared. Please start a new game.", "error")
    }
  }
})
