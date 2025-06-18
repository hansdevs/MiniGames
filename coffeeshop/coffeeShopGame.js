document.addEventListener("DOMContentLoaded", () => {
  const SAVE_KEY = "coffeeShopGameSaveData_v3"
  const gameState = JSON.parse(localStorage.getItem(SAVE_KEY))

  if (!gameState || gameState.gameVersion !== "3.0.0") {
    alert("No valid game data found or data is outdated! Redirecting to create a new game.")
    window.location.href = "createSave.html"
    return
  }

  // --- Default State Augmentation ---
  const defaultShopHours = {
    Mon: { isOpen: true, open: 8 * 60, close: 22 * 60 },
    Tue: { isOpen: true, open: 8 * 60, close: 22 * 60 },
    Wed: { isOpen: true, open: 8 * 60, close: 22 * 60 },
    Thu: { isOpen: true, open: 8 * 60, close: 22 * 60 },
    Fri: { isOpen: true, open: 8 * 60, close: 22 * 60 },
    Sat: { isOpen: true, open: 10 * 60, close: 20 * 60 },
    Sun: { isOpen: false, open: 10 * 60, close: 18 * 60 },
  }
  // If save file doesn't have shopHours, add it
  if (!gameState.shopHours) {
    gameState.shopHours = defaultShopHours
  }

  // Add assistant speed upgrade to gameState.upgrades
  if (!gameState.upgrades) {
    gameState.upgrades = {}
  }
  if (gameState.upgrades.assistantSpeed === undefined) {
    gameState.upgrades.assistantSpeed = 1
  }

  const backgroundImages = {
    barista: { solo: "../images/1-loading-barista.png", withAssistant: "../images/1-loading-assistant.png" },
    broista: { solo: "../images/2-loading-broista.png", withAssistant: "../images/2-loading-assistant.png" },
    "non-binary": { solo: "../images/3-loading-modern.png", withAssistant: "../images/3-loading-assistant.png" },
    closed: "../images/loading.png", // The character-free background
  }

  // --- Audio Management (Fixed to match save manager) ---
  let backgroundMusic = null
  let isMuted = localStorage.getItem("coffeeShopMuted") === "true"
  const musicPath = "../lib/coffeeShop/3_CoffeeBeans.wav"

  function setupAudio() {
    try {
      backgroundMusic = new Audio(musicPath)
      backgroundMusic.loop = true
      backgroundMusic.volume = 0.1
    } catch (e) {
      console.error("Failed to initialize audio on game page:", e)
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
        console.log("Game page audio autoplay prevented:", error)
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
    const gameMuteButton = document.getElementById("gameMuteButton")
    if (gameMuteButton) {
      gameMuteButton.textContent = isMuted ? "Unmute" : "Mute"
    }
  }

  // --- DOM Elements ---
  const playerNameDisplay = document.getElementById("playerNameDisplay")
  const shopNameDisplay = document.getElementById("shopNameDisplay")
  const playerLevelDisplay = document.getElementById("playerLevelDisplay")
  const xpProgressFill = document.getElementById("xpProgressFill")
  const xpPointsDisplay = document.getElementById("xpPointsDisplay")
  const xpToNextLevelDisplay = document.getElementById("xpToNextLevelDisplay")
  const walletAmountDisplay = document.getElementById("walletAmountDisplay")
  const shopRatingStars = document.getElementById("shopRatingStars")
  const shopRatingValue = document.getElementById("shopRatingValue")
  const customersServedDisplay = document.getElementById("customersServedDisplay")
  const currentTimeDisplay = document.getElementById("currentTimeDisplay")
  const gameDayDisplay = document.getElementById("gameDay")
  const shopStatusMessage = document.getElementById("shopStatusMessage")
  const shopViewBackground = document.getElementById("shopViewBackground")
  const shopClosedOverlay = document.getElementById("shopClosedOverlay")
  const menuItemsContainer = document.getElementById("menuItemsContainer")
  const customerQueueVisual = document.getElementById("customerQueueArea")
  const servicePointVisual = document.getElementById("servicePoint")

  const activeCustomerTicketDiv = document.getElementById("activeCustomerTicket")
  const ticketContent = document.getElementById("ticketContent")
  const completeOrderButton = document.getElementById("completeOrderButton")

  const assistantTicketDiv = document.getElementById("assistantTicket")
  const assistantTicketContent = document.getElementById("assistantTicketContent")

  const endDayButton = document.getElementById("endDayButton")
  const hireAssistantButton = document.getElementById("hireAssistantButton")
  const upgradeEspressoMachineButton = document.getElementById("upgradeEspressoMachine")
  const dailyGoalsList = document.getElementById("dailyGoalsList")

  const dailyReportModal = document.getElementById("dailyReportModal")
  const dailyReportContent = document.getElementById("dailyReportContent")
  const closeModalButton = document.querySelector(".close-modal-button")
  const startNextDayButton = document.getElementById("startNextDayButton")

  const dayOfWeek = document.getElementById("dayOfWeek")
  const timeProgressFill = document.getElementById("timeProgressFill")
  const scheduleControls = document.getElementById("scheduleControls")
  const gameMuteButton = document.getElementById("gameMuteButton")

  // --- Game State & Logic ---
  let activeCustomer = null
  let customerQueue = []
  let assistantServingCustomer = null
  const MAX_QUEUE_SIZE = 3
  let shopOpen = true
  let assistantInterval = null
  const ASSISTANT_HELP_INTERVAL = 8000
  const ORDER_WAIT_WARNING_THRESHOLD = 300
  const ORDER_WAIT_CRITICAL_THRESHOLD = 600

  let dailyStats = { earnings: 0, tips: 0, ratingStart: gameState.rating, xpStart: gameState.xp }

  function updateShopBackground() {
    if (!shopOpen) {
      shopViewBackground.style.backgroundImage = `url('${backgroundImages.closed}')`
      return
    }
    const playerTypeId = gameState.playerStaff.id || "barista"
    const images = backgroundImages[playerTypeId]
    if (images) {
      const newBgUrl = gameState.upgrades.assistantHired ? images.withAssistant : images.solo
      shopViewBackground.style.backgroundImage = `url('${newBgUrl}')`
    }
  }

  function updateUI() {
    updateShopBackground()

    // Basic info
    if (playerNameDisplay) playerNameDisplay.textContent = gameState.playerName
    if (shopNameDisplay) shopNameDisplay.textContent = gameState.shopName
    if (playerLevelDisplay) playerLevelDisplay.textContent = gameState.level
    if (xpPointsDisplay) xpPointsDisplay.textContent = gameState.xp
    if (xpToNextLevelDisplay) xpToNextLevelDisplay.textContent = gameState.xpToNextLevel
    if (xpProgressFill) xpProgressFill.style.width = `${(gameState.xp / gameState.xpToNextLevel) * 100}%`
    if (walletAmountDisplay) walletAmountDisplay.textContent = gameState.wallet.toFixed(2)

    // Rating
    const stars = "⭐".repeat(Math.floor(gameState.rating)) + "☆".repeat(5 - Math.floor(gameState.rating))
    if (shopRatingStars) shopRatingStars.textContent = stars
    if (shopRatingValue) shopRatingValue.textContent = gameState.rating.toFixed(1)

    // Customers and time
    if (customersServedDisplay) customersServedDisplay.textContent = gameState.customersServedToday
    const hours = Math.floor(gameState.currentTime / 60) % 24
    const minutes = gameState.currentTime % 60
    if (currentTimeDisplay)
      currentTimeDisplay.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    if (gameDayDisplay) gameDayDisplay.textContent = gameState.day
    if (shopStatusMessage) shopStatusMessage.textContent = shopOpen ? "Shop: OPEN" : "Shop: CLOSED"
    if (shopClosedOverlay) shopClosedOverlay.style.display = shopOpen ? "none" : "flex"

    // Buttons
    if (hireAssistantButton) {
      hireAssistantButton.disabled = gameState.upgrades.assistantHired
      hireAssistantButton.textContent = gameState.upgrades.assistantHired
        ? "Assistant Hired"
        : `Hire Assistant ($${hireAssistantButton.dataset.cost})`
    }

    if (upgradeEspressoMachineButton) {
      upgradeEspressoMachineButton.textContent = `Espresso Machine Mk ${gameState.upgrades.espressoMachine + 1} ($${upgradeEspressoMachineButton.dataset.cost * gameState.upgrades.espressoMachine})`
      upgradeEspressoMachineButton.disabled =
        gameState.wallet < upgradeEspressoMachineButton.dataset.cost * gameState.upgrades.espressoMachine
    }

    renderMenuItems()
    renderCustomerQueueVisual()
    renderActiveCustomerVisual()
    renderAssistantTicketVisual()
    renderDailyGoals()

    // Day of week
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const currentDayName = dayNames[(gameState.day - 1) % 7]
    if (dayOfWeek) dayOfWeek.textContent = currentDayName
  }

  function renderDailyGoals() {
    if (!dailyGoalsList) return
    dailyGoalsList.innerHTML = ""
    gameState.dailyGoals.forEach((goal) => {
      const li = document.createElement("li")
      li.textContent = `${goal.description} (${goal.current}/${goal.target})`
      if (goal.completed) li.classList.add("completed-goal")
      dailyGoalsList.appendChild(li)
    })
  }

  function updateGoalProgress(type, amount) {
    gameState.dailyGoals.forEach((goal) => {
      if (goal.type === type && !goal.completed) {
        goal.current += amount
        if (goal.current >= goal.target) {
          goal.completed = true
          gameState.xp += 20
          gameState.wallet += 25
          alert(`Goal Completed: ${goal.description}! You earned $25 and 20 XP!`)
          checkLevelUp()
        }
      }
    })
    renderDailyGoals()
  }

  function renderMenuItems() {
    if (!menuItemsContainer) return
    menuItemsContainer.innerHTML = ""
    gameState.menuItems.forEach((item) => {
      const itemDiv = document.createElement("div")
      itemDiv.className = "menu-item-ingame"
      itemDiv.dataset.itemId = item.id
      if (!item.unlocked) itemDiv.classList.add("locked")
      else itemDiv.draggable = true

      itemDiv.innerHTML = `
          <img src="${item.img}" alt="${item.name}">
          <div class="item-details">
              <strong>${item.name}</strong>
              <span>Stock: ${item.stock}</span>
          </div>
      `
      menuItemsContainer.appendChild(itemDiv)
    })
  }

  function getUnlockLevel(itemId) {
    const unlockLevels = {
      croissant: 2,
      "coffee-cup": 3,
      sandwich: 4,
      "chocolate-donut": 5,
      "frosted-blueberry-donut": 6,
      "chocolate-muffin": 7,
    }
    return unlockLevels[itemId] || 1
  }

  function spawnCustomer() {
    if (
      !shopOpen ||
      customerQueue.length + (activeCustomer ? 1 : 0) + (assistantServingCustomer ? 1 : 0) >= MAX_QUEUE_SIZE + 2 ||
      Math.random() > 0.3
    )
      return
    const availableItems = gameState.menuItems.filter((item) => item.unlocked && item.stock > 0)
    if (availableItems.length === 0) return
    const orderItemCount = Math.floor(Math.random() * 2) + 1
    const customerOrder = []
    for (let i = 0; i < orderItemCount; i++) {
      const randomIdx = Math.floor(Math.random() * availableItems.length)
      if (!customerOrder.find((co) => co.id === availableItems[randomIdx].id)) {
        customerOrder.push({ ...availableItems[randomIdx] })
      }
    }
    if (customerOrder.length === 0) return
    const customer = {
      id: Date.now(),
      name: `Cust. #${Math.floor(Math.random() * 1000)}`,
      img: `../images/customer${Math.random() > 0.5 ? "1" : "2"}.png`,
      orderItems: customerOrder.map((item) => ({ itemId: item.id, name: item.name, price: item.price, quantity: 1 })),
      preparedItems: [],
      orderTime: gameState.currentTime,
      serviceStartTime: null,
      beingServedBy: null,
      patience: 100, // NEW: patience system (0-100)
      maxPatience: 100,
    }
    customerQueue.push(customer)
    renderCustomerQueueVisual()
  }

  function renderCustomerQueueVisual() {
    if (!customerQueueVisual) return
    customerQueueVisual.innerHTML = ""
    customerQueue.forEach((customer, index) => {
      const custDiv = document.createElement("div")
      custDiv.className = "customer-sprite waiting"
      custDiv.style.left = `${index * 80}px` // INCREASED spacing from 60px to 80px
      custDiv.innerHTML = `<img src="${customer.img}" alt="Waiting Customer">`

      // NEW: Add patience indicators
      if (customer.patience < 50) {
        custDiv.classList.add("impatient")
      }
      if (customer.patience < 25) {
        custDiv.classList.add("very-impatient")
      }

      if (customer.beingServedBy === "assistant_queue") {
        custDiv.classList.add("assistant-processing-visual")
      }

      if (index === 0 && !activeCustomer && !customer.beingServedBy) {
        custDiv.onclick = () => serveNextCustomer()
      }
      customerQueueVisual.appendChild(custDiv)
    })
  }

  function serveNextCustomer() {
    if (activeCustomer || customerQueue.length === 0 || !shopOpen) return
    const nextInQueue = customerQueue[0]
    if (nextInQueue.beingServedBy === "assistant_queue") return

    activeCustomer = customerQueue.shift()
    activeCustomer.serviceStartTime = Date.now()
    activeCustomer.beingServedBy = "player"
    renderCustomerQueueVisual()
    renderActiveCustomerVisual()
    updateUI()
  }

  function renderActiveCustomerVisual() {
    if (!activeCustomerTicketDiv || !ticketContent || !servicePointVisual) return

    activeCustomerTicketDiv.classList.remove("long-wait", "critical-wait")
    if (activeCustomer) {
      activeCustomerTicketDiv.style.display = "flex"
      let ticketHTML = `<strong>${activeCustomer.name}</strong><ul>`
      activeCustomer.orderItems.forEach((item) => {
        const preparedCount = activeCustomer.preparedItems.find((p) => p.itemId === item.itemId)?.quantity || 0
        ticketHTML += `<li>${item.quantity}x ${item.name} ${preparedCount > 0 ? `(${preparedCount}/${item.quantity} ready)` : ""}</li>`
      })
      ticketHTML += `</ul>`
      ticketContent.innerHTML = ticketHTML

      const orderAge = gameState.currentTime - activeCustomer.orderTime
      if (orderAge >= ORDER_WAIT_CRITICAL_THRESHOLD) {
        activeCustomerTicketDiv.classList.add("critical-wait")
      } else if (orderAge >= ORDER_WAIT_WARNING_THRESHOLD) {
        activeCustomerTicketDiv.classList.add("long-wait")
      }

      if (completeOrderButton) completeOrderButton.disabled = false
      servicePointVisual.innerHTML = `<div class="customer-sprite at-counter"><img src="${activeCustomer.img}" alt="Serving Customer"></div>`
    } else {
      activeCustomerTicketDiv.style.display = "none"
      ticketContent.innerHTML = "No active order."
      if (completeOrderButton) completeOrderButton.disabled = true
      servicePointVisual.innerHTML = ""
    }
  }

  function renderAssistantTicketVisual() {
    if (!assistantTicketDiv || !assistantTicketContent) return

    if (assistantServingCustomer) {
      assistantTicketDiv.style.display = "flex"
      let ticketHTML = `<strong>${assistantServingCustomer.name}</strong> (Assistant)<ul>`
      assistantServingCustomer.orderItems.forEach((item) => {
        ticketHTML += `<li>${item.quantity}x ${item.name}</li>`
      })
      ticketHTML += `</ul><p>Time left: ${Math.ceil(assistantServingCustomer.assistantTimeLeft / 1000)}s</p>`
      assistantTicketContent.innerHTML = ticketHTML
    } else {
      assistantTicketDiv.style.display = "none"
    }
  }

  function attemptToPrepareItem(menuItem) {
    if (!activeCustomer || !shopOpen) return
    const desiredItem = activeCustomer.orderItems.find((item) => item.itemId === menuItem.id)
    if (!desiredItem) return alert("This item is not on the customer's order!")
    const preparedItemInfo = activeCustomer.preparedItems.find((item) => item.itemId === menuItem.id)
    const currentPreparedQuantity = preparedItemInfo ? preparedItemInfo.quantity : 0
    if (currentPreparedQuantity >= desiredItem.quantity)
      return alert(`You've already prepared enough ${menuItem.name}.`)
    if (menuItem.stock <= 0) return alert(`${menuItem.name} is out of stock!`)
    menuItem.stock--
    if (preparedItemInfo) preparedItemInfo.quantity++
    else
      activeCustomer.preparedItems.push({
        itemId: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price,
      })
    renderActiveCustomerVisual()
    renderMenuItems()
    checkOrderCompletion()
  }

  function checkOrderCompletion() {
    if (!activeCustomer || !completeOrderButton) return
    let allPrepared = true
    for (const desired of activeCustomer.orderItems) {
      const prepared = activeCustomer.preparedItems.find((p) => p.itemId === desired.itemId)
      if (!prepared || prepared.quantity < desired.quantity) {
        allPrepared = false
        break
      }
    }
    completeOrderButton.disabled = !allPrepared
  }

  function checkLevelUp() {
    if (gameState.xp >= gameState.xpToNextLevel) {
      gameState.level++
      gameState.xp -= gameState.xpToNextLevel
      gameState.xpToNextLevel = Math.floor(gameState.xpToNextLevel * 1.4)
      showLevelUpNotification(`🎉 LEVEL UP! You are now Level ${gameState.level}! 🎉`)

      gameState.menuItems.forEach((item) => {
        if (!item.unlocked && gameState.level >= getUnlockLevel(item.id)) {
          item.unlocked = true
          showLevelUpNotification(`🆕 New item unlocked: ${item.name}! 🆕`)
        }
      })
    }
  }

  function showLevelUpNotification(message) {
    const notification = document.createElement("div")
    notification.className = "level-up-notification"
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.classList.add("fade-out")
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 500)
    }, 3000)
  }

  function assistantHelps() {
    if (!gameState.upgrades.assistantHired || !shopOpen || assistantServingCustomer) return

    if (customerQueue.length > 0) {
      const customerToHelp = customerQueue.find((c) => !c.beingServedBy)
      if (!customerToHelp) return

      customerToHelp.beingServedBy = "assistant_queue"
      renderCustomerQueueVisual()

      setTimeout(() => {
        if (customerQueue[0] !== customerToHelp) {
          customerToHelp.beingServedBy = null
          renderCustomerQueueVisual()
          return
        }
        assistantServingCustomer = customerQueue.shift()
        assistantServingCustomer.beingServedBy = "assistant"

        // Use upgraded speed
        const baseTime = ASSISTANT_HELP_INTERVAL
        const speedReduction = (gameState.upgrades.assistantSpeed - 1) * 1000
        assistantServingCustomer.assistantTimeLeft = Math.max(3000, baseTime - speedReduction)

        renderCustomerQueueVisual()
        renderAssistantTicketVisual()

        const assistantProcessInterval = setInterval(() => {
          if (!assistantServingCustomer) {
            clearInterval(assistantProcessInterval)
            return
          }
          assistantServingCustomer.assistantTimeLeft -= 1000
          renderAssistantTicketVisual()
          if (assistantServingCustomer.assistantTimeLeft <= 0) {
            clearInterval(assistantProcessInterval)
            let orderTotal = 0
            assistantServingCustomer.orderItems.forEach((item) => {
              const menuItem = gameState.menuItems.find((mi) => mi.id === item.itemId)
              if (menuItem && menuItem.stock >= item.quantity) {
                menuItem.stock -= item.quantity
                orderTotal += menuItem.price * item.quantity
              }
            })

            if (orderTotal > 0) {
              gameState.wallet += orderTotal
              gameState.xp += 5
              gameState.customersServedToday++
              dailyStats.earnings += orderTotal
              updateGoalProgress("serve", 1)
              updateGoalProgress("earn", orderTotal)
              console.log(`Assistant served ${assistantServingCustomer.name} for $${orderTotal.toFixed(2)}.`)
            }
            assistantServingCustomer = null
            renderAssistantTicketVisual()
            renderMenuItems()
            updateUI()
          }
        }, 1000)
      }, 500)
    }
  }

  // --- Schedule Controls Logic ---
  function renderScheduleControls() {
    if (!scheduleControls) return

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const dayButtonsContainer = scheduleControls.querySelector(".day-toggle-buttons")
    if (!dayButtonsContainer) return

    dayButtonsContainer.innerHTML = ""
    days.forEach((day) => {
      const button = document.createElement("button")
      button.textContent = day.charAt(0)
      button.dataset.day = day
      if (gameState.shopHours[day].isOpen) {
        button.classList.add("active")
      }
      button.addEventListener("click", () => {
        gameState.shopHours[day].isOpen = !gameState.shopHours[day].isOpen
        renderScheduleControls()
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState))
      })
      dayButtonsContainer.appendChild(button)
    })

    const openInput = scheduleControls.querySelector("#openTimeInput")
    const closeInput = scheduleControls.querySelector("#closeTimeInput")
    if (openInput && closeInput) {
      openInput.value = minutesToTimeStr(gameState.shopHours.Mon.open)
      closeInput.value = minutesToTimeStr(gameState.shopHours.Mon.close)

      openInput.addEventListener("change", () => {
        const newTime = timeStrToMinutes(openInput.value)
        Object.values(gameState.shopHours).forEach((day) => (day.open = newTime))
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState))
      })
      closeInput.addEventListener("change", () => {
        const newTime = timeStrToMinutes(closeInput.value)
        Object.values(gameState.shopHours).forEach((day) => (day.close = newTime))
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState))
      })
    }
  }

  function minutesToTimeStr(minutes) {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0")
    const m = (minutes % 60).toString().padStart(2, "0")
    return `${h}:${m}`
  }

  function timeStrToMinutes(timeStr) {
    const [h, m] = timeStr.split(":").map(Number)
    return h * 60 + m
  }

  function gameTick() {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const currentDayName = dayNames[(gameState.day - 1) % 7]
    const currentSchedule = gameState.shopHours[currentDayName]

    const shouldBeOpen =
      currentSchedule.isOpen &&
      gameState.currentTime >= currentSchedule.open &&
      gameState.currentTime < currentSchedule.close
    if (shopOpen && !shouldBeOpen) {
      endCurrentDay()
      return
    }
    shopOpen = shouldBeOpen

    if (!shopOpen) {
      updateUI()
      return
    }

    gameState.currentTime += 10
    if (gameState.currentTime >= 22 * 60) {
      endCurrentDay()
      return
    }
    spawnCustomer()

    // NEW: Decrease customer patience
    customerQueue.forEach((customer, index) => {
      if (customer.patience > 0) {
        customer.patience -= 0.5 // Lose patience over time
        if (customer.patience <= 0) {
          // Customer leaves
          customerQueue.splice(index, 1)
          gameState.rating = Math.max(1, gameState.rating - 0.3)
          showLevelUpNotification("😠 A customer left due to long wait!")
        }
      }
    })

    // Also decrease active customer patience
    if (activeCustomer && activeCustomer.patience > 0) {
      activeCustomer.patience -= 0.3
      if (activeCustomer.patience <= 0) {
        gameState.rating = Math.max(1, gameState.rating - 0.5)
        showLevelUpNotification("😡 Customer left angry!")
        activeCustomer = null
      }
    }

    if (activeCustomer) renderActiveCustomerVisual()

    if (timeProgressFill && currentSchedule) {
      const totalWorkMinutes = currentSchedule.close - currentSchedule.open
      const minutesPassed = gameState.currentTime - currentSchedule.open
      const progressPercent = Math.max(0, (minutesPassed / totalWorkMinutes) * 100)
      timeProgressFill.style.width = `${progressPercent}%`
    }

    updateUI()
  }

  async function showDailyReport() {
    try {
      // Create the report content directly instead of fetching
      const reportHtmlContent = `
      <h2>Daily Report</h2>
      <div class="report-grid">
          <div class="report-item">
              <h4>Day Completed</h4>
              <p id="reportDay">--</p>
          </div>
          <div class="report-item">
              <h4>Customers Served</h4>
              <p id="reportCustomersServed">--</p>
          </div>
          <div class="report-item">
              <h4>Total Earnings</h4>
              <p id="reportTotalEarnings">$ --.--</p>
          </div>
          <div class="report-item">
              <h4>Tips Received</h4>
              <p id="reportTipsReceived">$ --.--</p>
          </div>
          <div class="report-item">
              <h4>Rating Change</h4>
              <p id="reportRatingChange">--</p>
          </div>
          <div class="report-item">
              <h4>XP Gained</h4>
              <p id="reportXPGained">--</p>
          </div>
      </div>
      <h4>Goals Status:</h4>
      <ul id="reportGoalsStatus">
          <li>Goal 1: Not Met</li>
          <li>Goal 2: Not Met</li>
      </ul>
      <div id="reportBonuses">
          <!-- Bonuses will be listed here -->
      </div>
      <button id="startNextDayButton" class="action-button">Start Next Day</button>
    `

      if (dailyReportContent) {
        dailyReportContent.innerHTML = reportHtmlContent

        // Populate report data
        const reportDay = document.getElementById("reportDay")
        const reportCustomersServed = document.getElementById("reportCustomersServed")
        const reportTotalEarnings = document.getElementById("reportTotalEarnings")
        const reportTipsReceived = document.getElementById("reportTipsReceived")
        const reportRatingChange = document.getElementById("reportRatingChange")
        const reportXPGained = document.getElementById("reportXPGained")

        if (reportDay) reportDay.textContent = gameState.day - 1
        if (reportCustomersServed) reportCustomersServed.textContent = gameState.customersServedToday
        if (reportTotalEarnings) reportTotalEarnings.textContent = `$${dailyStats.earnings.toFixed(2)}`
        if (reportTipsReceived) reportTipsReceived.textContent = `$${dailyStats.tips.toFixed(2)}`

        const ratingChange = gameState.rating - dailyStats.ratingStart
        if (reportRatingChange)
          reportRatingChange.textContent = `${ratingChange >= 0 ? "+" : ""}${ratingChange.toFixed(1)}`
        if (reportXPGained) reportXPGained.textContent = gameState.xp - dailyStats.xpStart

        const goalsReportUl = document.getElementById("reportGoalsStatus")
        if (goalsReportUl) {
          goalsReportUl.innerHTML = ""
          gameState.dailyGoals.forEach((goal) => {
            const li = document.createElement("li")
            li.textContent = `${goal.description}: ${goal.completed ? "Met!" : "Not Met"}`
            if (goal.completed) li.style.color = "green"
            goalsReportUl.appendChild(li)
          })
        }

        const bonusesDiv = document.getElementById("reportBonuses")
        if (bonusesDiv) {
          bonusesDiv.innerHTML = ""
          if (gameState.dailyGoals.every((g) => g.completed)) {
            bonusesDiv.innerHTML += "<p>All Goals Met Bonus: +$100, +50 XP</p>"
          }
        }

        if (dailyReportModal) dailyReportModal.style.display = "flex"
      }
    } catch (error) {
      console.error("Error creating daily report:", error)
      prepareNextDay()
    }
  }

  function prepareNextDay() {
    shopOpen = true
    dailyStats = { earnings: 0, tips: 0, ratingStart: gameState.rating, xpStart: gameState.xp }
    updateUI()
  }

  function endCurrentDay() {
    shopOpen = false
    if (assistantInterval) clearInterval(assistantInterval)
    assistantInterval = null
    if (assistantServingCustomer) {
      console.log("Assistant order for " + assistantServingCustomer.name + " interrupted by day end.")
      assistantServingCustomer = null
    }

    if (shopStatusMessage) shopStatusMessage.textContent = "Shop: CLOSED - Preparing Report..."
    updateUI()

    const goalsMet = gameState.dailyGoals.every((g) => g.completed)
    if (goalsMet) {
      gameState.xp += 50
      gameState.wallet += 100
    }
    checkLevelUp()

    showDailyReport()

    gameState.day++
    gameState.currentTime = 8 * 60
    gameState.customersServedToday = 0
    customerQueue = []
    if (activeCustomer) activeCustomer = null

    gameState.dailyGoals = [
      {
        description: `Serve ${5 + gameState.level} customers`,
        target: 5 + gameState.level,
        current: 0,
        type: "serve",
        completed: false,
      },
      {
        description: `Earn $${50 * gameState.level}`,
        target: 50 * gameState.level,
        current: 0,
        type: "earn",
        completed: false,
      },
    ]
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState))
  }

  // --- Event Listeners ---
  if (gameMuteButton) {
    gameMuteButton.addEventListener("click", () => {
      initGlobalAudioContext()
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

  // Drag and Drop
  document.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("menu-item-ingame") && !e.target.classList.contains("locked")) {
      e.dataTransfer.setData("text/plain", e.target.dataset.itemId)
      e.dataTransfer.effectAllowed = "move"
    }
  })

  if (activeCustomerTicketDiv) {
    activeCustomerTicketDiv.addEventListener("dragover", (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      activeCustomerTicketDiv.classList.add("drag-over")
    })

    activeCustomerTicketDiv.addEventListener("dragleave", () => {
      activeCustomerTicketDiv.classList.remove("drag-over")
    })

    activeCustomerTicketDiv.addEventListener("drop", (e) => {
      e.preventDefault()
      activeCustomerTicketDiv.classList.remove("drag-over")
      const itemId = e.dataTransfer.getData("text/plain")
      const menuItem = gameState.menuItems.find((item) => item.id === itemId)
      if (menuItem) {
        attemptToPrepareItem(menuItem)
      }
    })
  }

  if (completeOrderButton) {
    completeOrderButton.addEventListener("click", () => {
      if (!activeCustomer || !shopOpen) return
      let allPrepared = true
      for (const desired of activeCustomer.orderItems) {
        const prepared = activeCustomer.preparedItems.find((p) => p.itemId === desired.itemId)
        if (!prepared || prepared.quantity < desired.quantity) {
          allPrepared = false
          break
        }
      }
      if (!allPrepared) return alert("Not all items prepared for the order!")
      let orderTotal = 0
      activeCustomer.preparedItems.forEach((item) => {
        orderTotal += item.price * item.quantity
      })
      const serviceTimeRealSeconds = (Date.now() - activeCustomer.serviceStartTime) / 1000
      let tip = 0
      if (serviceTimeRealSeconds <= 10) tip = orderTotal * 0.2
      else if (serviceTimeRealSeconds <= 20) tip = orderTotal * 0.1
      gameState.wallet += orderTotal + tip
      gameState.xp += 15 + (tip > 0 ? 5 : 0)
      gameState.customersServedToday++
      gameState.rating = Math.min(5, gameState.rating + (tip > 0 ? 0.2 : 0.1))
      dailyStats.earnings += orderTotal
      dailyStats.tips += tip
      updateGoalProgress("serve", 1)
      updateGoalProgress("earn", orderTotal + tip)
      alert(`Order complete! Total: $${orderTotal.toFixed(2)} + Tip: $${tip.toFixed(2)}`)
      activeCustomer = null
      checkLevelUp()
      updateUI()
    })
  }

  if (hireAssistantButton) {
    hireAssistantButton.addEventListener("click", () => {
      const cost = Number.parseInt(hireAssistantButton.dataset.cost)
      if (!gameState.upgrades.assistantHired && gameState.wallet >= cost) {
        if (gameState.availableAssistants && gameState.availableAssistants.length > 0) {
          gameState.wallet -= cost
          gameState.upgrades.assistantHired = true
          gameState.hiredAssistant = gameState.availableAssistants.shift()
          alert(`${gameState.hiredAssistant.name} hired as an assistant!`)
          assistantInterval = setInterval(assistantHelps, ASSISTANT_HELP_INTERVAL)
          updateUI()
        } else {
          alert("No available characters to hire as an assistant!")
        }
      } else if (gameState.upgrades.assistantHired) {
        alert("You already have an assistant!")
      } else {
        alert("Not enough money to hire an assistant!")
      }
    })
  }

  if (upgradeEspressoMachineButton) {
    upgradeEspressoMachineButton.addEventListener("click", () => {
      const currentLevel = gameState.upgrades.espressoMachine
      const cost = Number.parseInt(upgradeEspressoMachineButton.dataset.cost) * currentLevel
      if (gameState.wallet >= cost) {
        gameState.wallet -= cost
        gameState.upgrades.espressoMachine++
        alert(`Espresso Machine upgraded to Mk ${gameState.upgrades.espressoMachine}!`)
        updateUI()
      } else {
        alert("Not enough money for this upgrade!")
      }
    })
  }

  const upgradeAssistantSpeedButton = document.getElementById("upgradeAssistantSpeed")
  if (upgradeAssistantSpeedButton) {
    upgradeAssistantSpeedButton.addEventListener("click", () => {
      const currentLevel = gameState.upgrades.assistantSpeed || 1
      const cost = 300 * currentLevel
      if (gameState.wallet >= cost) {
        gameState.wallet -= cost
        gameState.upgrades.assistantSpeed = currentLevel + 1
        showLevelUpNotification(`Assistant Speed upgraded to Level ${gameState.upgrades.assistantSpeed}!`)

        // Update assistant interval if hired
        if (assistantInterval) {
          clearInterval(assistantInterval)
          const newInterval = Math.max(3000, ASSISTANT_HELP_INTERVAL - (gameState.upgrades.assistantSpeed - 1) * 1000)
          assistantInterval = setInterval(assistantHelps, newInterval)
        }
        updateUI()
      } else {
        showLevelUpNotification("Not enough money for assistant speed upgrade!")
      }
    })
  }

  if (endDayButton) {
    endDayButton.addEventListener("click", endCurrentDay)
  }

  if (closeModalButton) {
    closeModalButton.onclick = () => {
      if (dailyReportModal) dailyReportModal.style.display = "none"
      prepareNextDay()
    }
  }

  // Handle startNextDayButton click (it gets created dynamically)
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "startNextDayButton") {
      if (dailyReportModal) dailyReportModal.style.display = "none"
      prepareNextDay()
    }
  })

  // --- Initialization ---
  renderScheduleControls()
  setupAudio()
  updateUI()
  setInterval(gameTick, 1000)
  if (gameState.upgrades.assistantHired && !assistantInterval) {
    const speedReduction = (gameState.upgrades.assistantSpeed - 1) * 1000
    const interval = Math.max(3000, ASSISTANT_HELP_INTERVAL - speedReduction)
    assistantInterval = setInterval(assistantHelps, interval / 2)
  }

  document.body.addEventListener("click", initGlobalAudioContext, { once: true })
  document.body.addEventListener("touchstart", initGlobalAudioContext, { once: true })
})
