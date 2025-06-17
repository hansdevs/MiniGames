document.addEventListener("DOMContentLoaded", () => {
  const SAVE_KEY = "coffeeShopGameSaveData_v3"
  const gameState = JSON.parse(localStorage.getItem(SAVE_KEY))

  if (!gameState || gameState.gameVersion !== "3.0.0") {
    alert("No valid game data found or data is outdated! Redirecting to create a new game.")
    window.location.href = "createSave.html"
    return
  }

  // --- Audio Management ---
  let audioContext
  const audioBuffers = {}
  let isGameMuted = localStorage.getItem("coffeeShopMuted") === "true"
  const gameMuteButton = document.getElementById("gameMuteButton")
  const musicPath = "../lib/coffeeShop/3_CoffeeBeans.wav" // Corrected path
  let musicSourceNode

  async function initAudio() {
    if (audioContext) return // Already initialized
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      if (audioContext.state === "suspended") {
        await audioContext.resume()
      }
      await loadSound("gameMusic", musicPath) // Load main music first
      // Defer other sounds or load them as needed
      // await loadSounds()
      updateGameMuteButtonText()
      if (!isGameMuted && audioBuffers.gameMusic) playMusic("gameMusic")
    } catch (e) {
      console.error("AudioContext not supported or error initializing audio:", e)
    }
  }

  async function loadSound(name, url) {
    if (!audioContext) return
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      audioBuffers[name] = await audioContext.decodeAudioData(arrayBuffer)
    } catch (e) {
      console.error(`Error loading sound ${name} from ${url}:`, e)
    }
  }

  // Example: Load other sounds on demand or after main music
  // async function loadOtherSounds() { ... }

  function playSound(name, volume = 0.4) {
    // Adjusted default volume
    if (isGameMuted || !audioContext || !audioBuffers[name] || audioContext.state !== "running") return
    const source = audioContext.createBufferSource()
    source.buffer = audioBuffers[name]
    const gainNode = audioContext.createGain()
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
    source.connect(gainNode).connect(audioContext.destination)
    source.start()
  }

  function playMusic(name, volume = 0.08) {
    // Adjusted default music volume
    if (isGameMuted || !audioContext || !audioBuffers[name] || audioContext.state !== "running") return
    if (musicSourceNode) {
      musicSourceNode.stop()
      musicSourceNode.disconnect()
    }
    musicSourceNode = audioContext.createBufferSource()
    musicSourceNode.buffer = audioBuffers[name]
    musicSourceNode.loop = true
    const gainNode = audioContext.createGain()
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
    musicSourceNode.connect(gainNode).connect(audioContext.destination)
    musicSourceNode.start()
  }

  function stopMusic() {
    if (musicSourceNode) {
      musicSourceNode.stop()
    }
  }

  function updateGameMuteButtonText() {
    if (gameMuteButton) gameMuteButton.textContent = isGameMuted ? "Unmute" : "Mute"
  }

  if (gameMuteButton) {
    gameMuteButton.addEventListener("click", async () => {
      if (!audioContext)
        await initAudio() // Ensure audio is initialized
      else if (audioContext.state === "suspended") await audioContext.resume()

      if (audioContext && audioContext.state === "running") {
        isGameMuted = !isGameMuted
        localStorage.setItem("coffeeShopMuted", isGameMuted)
        updateGameMuteButtonText()
        if (isGameMuted) {
          stopMusic()
        } else {
          if (audioBuffers.gameMusic) playMusic("gameMusic")
        }
      } else {
        console.log("AudioContext not running, cannot toggle mute yet.")
      }
    })
  }

  // Initial audio setup attempt (will likely require user interaction)
  // The actual playback will start after user interaction if context is suspended.
  initAudio()
  document.body.addEventListener(
    "click",
    () => {
      if (audioContext && audioContext.state === "suspended") audioContext.resume()
    },
    { once: true },
  )
  document.body.addEventListener(
    "touchstart",
    () => {
      if (audioContext && audioContext.state === "suspended") audioContext.resume()
    },
    { once: true },
  )

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

  const playerStaffImage = document.getElementById("playerStaffImage")
  const assistantStaffDiv = document.getElementById("assistantStaff")
  const assistantStaffImage = document.getElementById("assistantStaffImage")

  const menuItemsContainer = document.getElementById("menuItemsContainer")
  const customerQueueVisual = document.getElementById("customerQueueArea")
  const servicePointVisual = document.getElementById("servicePoint")

  const activeCustomerTicket = document.getElementById("activeCustomerTicket")
  const ticketContent = document.getElementById("ticketContent")

  const fulfillOrderButton = document.getElementById("fulfillOrderButton")
  const cancelOrderButton = document.getElementById("cancelOrderButton")
  const endDayButton = document.getElementById("endDayButton")
  const hireAssistantButton = document.getElementById("hireAssistantButton")
  const upgradeEspressoMachineButton = document.getElementById("upgradeEspressoMachine")
  const dailyGoalsList = document.getElementById("dailyGoalsList")

  // --- Game State Variables ---
  let activeCustomer = null
  let customerQueue = []
  const MAX_QUEUE_SIZE = 3 // Max visible in queue area
  let shopOpen = true // Shop starts open
  let assistantInterval = null
  const ASSISTANT_HELP_INTERVAL = 5000 // 5 real-life seconds

  // --- Game Logic Functions ---
  function updateUI() {
    playerNameDisplay.textContent = gameState.playerName
    shopNameDisplay.textContent = gameState.shopName
    playerLevelDisplay.textContent = gameState.level
    xpPointsDisplay.textContent = gameState.xp
    xpToNextLevelDisplay.textContent = gameState.xpToNextLevel
    xpProgressFill.style.width = `${(gameState.xp / gameState.xpToNextLevel) * 100}%`
    walletAmountDisplay.textContent = gameState.wallet.toFixed(2)

    // Rating display
    const stars = "⭐".repeat(Math.floor(gameState.rating)) + "☆".repeat(5 - Math.floor(gameState.rating))
    shopRatingStars.textContent = stars
    shopRatingValue.textContent = gameState.rating.toFixed(1)

    customersServedDisplay.textContent = gameState.customersServedToday
    playerStaffImage.src = gameState.playerStaff.img

    const hours = Math.floor(gameState.currentTime / 60) % 24
    const minutes = gameState.currentTime % 60
    currentTimeDisplay.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    gameDayDisplay.textContent = gameState.day
    shopStatusMessage.textContent = shopOpen ? "Shop: OPEN" : "Shop: CLOSED"

    if (gameState.hiredAssistant && gameState.hiredAssistant.img) {
      assistantStaffImage.src = gameState.hiredAssistant.img
      assistantStaffDiv.style.display = "block"
    } else {
      assistantStaffDiv.style.display = "none"
    }
    hireAssistantButton.disabled = gameState.upgrades.assistantHired
    hireAssistantButton.textContent = gameState.upgrades.assistantHired
      ? "Assistant Hired"
      : `Hire Assistant ($${hireAssistantButton.dataset.cost})`

    upgradeEspressoMachineButton.textContent = `Espresso Machine Mk ${gameState.upgrades.espressoMachine + 1} ($${upgradeEspressoMachineButton.dataset.cost * gameState.upgrades.espressoMachine})`
    upgradeEspressoMachineButton.disabled =
      gameState.wallet < upgradeEspressoMachineButton.dataset.cost * gameState.upgrades.espressoMachine

    renderMenuItems()
    renderCustomerQueueVisual()
    renderActiveCustomerVisual()
    renderDailyGoals()
  }

  function renderDailyGoals() {
    dailyGoalsList.innerHTML = ""
    gameState.dailyGoals.forEach((goal) => {
      const li = document.createElement("li")
      li.textContent = `${goal.description} (${goal.current}/${goal.target})`
      if (goal.completed) {
        li.classList.add("completed-goal")
      }
      dailyGoalsList.appendChild(li)
    })
  }

  function updateGoalProgress(type, amount) {
    gameState.dailyGoals.forEach((goal) => {
      if (goal.type === type && !goal.completed) {
        goal.current += amount
        if (goal.current >= goal.target) {
          goal.completed = true
          gameState.xp += 20 // Bonus XP for completing a goal
          gameState.wallet += 25 // Bonus cash
          alert(`Goal Completed: ${goal.description}! You earned $25 and 20 XP!`)
          checkLevelUp()
        }
      }
    })
    renderDailyGoals()
  }

  function renderMenuItems() {
    menuItemsContainer.innerHTML = ""
    gameState.menuItems.forEach((item) => {
      const itemDiv = document.createElement("div")
      itemDiv.className = "menu-item-ingame"
      if (!item.unlocked) itemDiv.classList.add("locked")

      itemDiv.innerHTML = `
          <img src="${item.img}" alt="${item.name}">
          <div class="item-details">
              <strong>${item.name} ${!item.unlocked ? "(Locked)" : ""}</strong>
              <span>$${item.price.toFixed(2)}</span>
              <span>Stock: ${item.stock}</span>
              ${!item.unlocked ? `<span>Unlocks at Lvl ${getUnlockLevel(item.id)}</span>` : ""}
          </div>
      `
      if (item.unlocked && activeCustomer && shopOpen) {
        itemDiv.onclick = () => attemptToPrepareItem(item)
      }
      menuItemsContainer.appendChild(itemDiv)
    })
  }

  function getUnlockLevel(itemId) {
    const unlockLevels = {
      croissant: 2,
      "coffee-cup": 3, // Espresso
      sandwich: 4,
      "chocolate-donut": 5,
      "frosted-blueberry-donut": 6,
      "chocolate-muffin": 7,
    }
    return unlockLevels[itemId] || 1 // Default to 1 if not in map (e.g. starting items)
  }

  function spawnCustomer() {
    if (!shopOpen || customerQueue.length >= MAX_QUEUE_SIZE || Math.random() > 0.25) return // Spawn chance

    const availableItems = gameState.menuItems.filter((item) => item.unlocked && item.stock > 0)
    if (availableItems.length === 0) return

    const orderItemCount = Math.floor(Math.random() * 2) + 1 // 1 to 2 items
    const customerOrder = []
    for (let i = 0; i < orderItemCount; i++) {
      const randomIdx = Math.floor(Math.random() * availableItems.length)
      // Ensure not to add same item twice for simplicity, or handle quantities
      if (!customerOrder.find((co) => co.id === availableItems[randomIdx].id)) {
        customerOrder.push({ ...availableItems[randomIdx] })
      }
    }
    if (customerOrder.length === 0) return // Should not happen if availableItems > 0

    const customer = {
      id: Date.now(),
      name: `Customer #${Math.floor(Math.random() * 1000)}`,
      img: `../images/customer${Math.random() > 0.5 ? "1" : "2"}.png`,
      orderItems: customerOrder.map((item) => ({ itemId: item.id, name: item.name, price: item.price, quantity: 1 })), // Desired items
      preparedItems: [], // Items player has prepared for them
      patience: 120, // Base patience in seconds
      arrivalTime: gameState.currentTime,
    }
    customerQueue.push(customer)
    // playSound("newCustomer", 0.3) // Placeholder for actual sound
    renderCustomerQueueVisual()
  }

  function renderCustomerQueueVisual() {
    customerQueueVisual.innerHTML = ""
    customerQueue.forEach((customer, index) => {
      const custDiv = document.createElement("div")
      custDiv.className = "customer-sprite waiting"
      custDiv.style.left = `${index * 60}px` // Simple horizontal queue
      custDiv.innerHTML = `<img src="${customer.img}" alt="Waiting Customer">`
      if (index === 0) {
        // Only first customer is clickable to serve
        custDiv.onclick = () => serveNextCustomer()
      }
      customerQueueVisual.appendChild(custDiv)
    })
  }

  function serveNextCustomer() {
    if (activeCustomer || customerQueue.length === 0 || !shopOpen) return
    activeCustomer = customerQueue.shift()
    activeCustomer.serviceStartTime = Date.now() // Real time for tip calculation
    renderCustomerQueueVisual()
    renderActiveCustomerVisual()
    updateUI()
  }

  function renderActiveCustomerVisual() {
    servicePointVisual.innerHTML = ""
    ticketContent.innerHTML = "No active order."
    fulfillOrderButton.disabled = true
    cancelOrderButton.disabled = true

    if (activeCustomer) {
      const activeCustDiv = document.createElement("div")
      activeCustDiv.className = "customer-sprite at-counter"
      activeCustDiv.innerHTML = `<img src="${activeCustomer.img}" alt="Serving Customer">`
      servicePointVisual.appendChild(activeCustDiv)

      let ticketHTML = `<h4>${activeCustomer.name}'s Order:</h4><ul>`
      activeCustomer.orderItems.forEach((item) => {
        ticketHTML += `<li>${item.quantity}x ${item.name}</li>`
      })
      ticketHTML += `</ul>`

      if (activeCustomer.preparedItems.length > 0) {
        ticketHTML += `<h5>Preparing:</h5><ul>`
        activeCustomer.preparedItems.forEach((item) => {
          ticketHTML += `<li>${item.quantity}x ${item.name}</li>`
        })
        ticketHTML += `</ul>`
      }
      ticketContent.innerHTML = ticketHTML
      fulfillOrderButton.disabled = false
      cancelOrderButton.disabled = false
    }
  }

  function attemptToPrepareItem(menuItem) {
    if (!activeCustomer || !shopOpen) return

    const desiredItem = activeCustomer.orderItems.find((item) => item.itemId === menuItem.id)
    if (!desiredItem) {
      alert("This item is not on the customer's order!")
      return
    }

    const preparedItemInfo = activeCustomer.preparedItems.find((item) => item.itemId === menuItem.id)
    const currentPreparedQuantity = preparedItemInfo ? preparedItemInfo.quantity : 0

    if (currentPreparedQuantity >= desiredItem.quantity) {
      alert(`You've already prepared enough ${menuItem.name}.`)
      return
    }

    if (menuItem.stock <= 0) {
      alert(`${menuItem.name} is out of stock!`)
      return
    }

    // Simulate preparation - for now, instant. Challenges can be re-added here.
    menuItem.stock--
    if (preparedItemInfo) {
      preparedItemInfo.quantity++
    } else {
      activeCustomer.preparedItems.push({
        itemId: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price,
      })
    }
    // playSound("itemAddedToOrder"); // Placeholder
    renderActiveCustomerVisual() // Update ticket
    renderMenuItems() // Update stock display
  }

  fulfillOrderButton.addEventListener("click", () => {
    if (!activeCustomer || !shopOpen) return

    // Check if all desired items are prepared
    let allPrepared = true
    for (const desired of activeCustomer.orderItems) {
      const prepared = activeCustomer.preparedItems.find((p) => p.itemId === desired.itemId)
      if (!prepared || prepared.quantity < desired.quantity) {
        allPrepared = false
        break
      }
    }

    if (!allPrepared) {
      alert("Not all items prepared for the order!")
      return
    }

    let orderTotal = 0
    activeCustomer.preparedItems.forEach((item) => {
      orderTotal += item.price * item.quantity
    })

    const serviceTimeRealSeconds = (Date.now() - activeCustomer.serviceStartTime) / 1000
    let tip = 0
    if (serviceTimeRealSeconds <= 10)
      tip = orderTotal * 0.2 // Fast service
    else if (serviceTimeRealSeconds <= 20) tip = orderTotal * 0.1 // Medium

    gameState.wallet += orderTotal + tip
    gameState.xp += 15 + (tip > 0 ? 5 : 0) // Base XP + tip bonus
    gameState.customersServedToday++
    gameState.rating = Math.min(5, gameState.rating + (tip > 0 ? 0.2 : 0.1))

    updateGoalProgress("serve", 1)
    updateGoalProgress("earn", orderTotal + tip)

    alert(`Order complete! Total: $${orderTotal.toFixed(2)} + Tip: $${tip.toFixed(2)}`)
    // playSound("orderComplete"); if tip > 0 playSound("tip");

    activeCustomer = null
    checkLevelUp()
    updateUI()
  })

  cancelOrderButton.addEventListener("click", () => {
    if (activeCustomer) {
      // Return prepared items to stock
      activeCustomer.preparedItems.forEach((pItem) => {
        const menuItem = gameState.menuItems.find((m) => m.id === pItem.itemId)
        if (menuItem) menuItem.stock += pItem.quantity
      })
      alert(`${activeCustomer.name} left. Order cancelled.`)
      gameState.rating = Math.max(1, gameState.rating - 0.25)
      activeCustomer = null
      updateUI()
    }
  })

  function checkLevelUp() {
    if (gameState.xp >= gameState.xpToNextLevel) {
      gameState.level++
      gameState.xp -= gameState.xpToNextLevel
      gameState.xpToNextLevel = Math.floor(gameState.xpToNextLevel * 1.4) // Adjusted progression
      alert(`Congratulations! You've reached Level ${gameState.level}!`)
      // Unlock items
      gameState.menuItems.forEach((item) => {
        if (!item.unlocked && gameState.level >= getUnlockLevel(item.id)) {
          item.unlocked = true
          alert(`New item unlocked: ${item.name}!`)
        }
      })
    }
  }

  function assistantHelps() {
    if (!gameState.upgrades.assistantHired || !shopOpen || customerQueue.length === 0) return

    const customerToHelp = customerQueue.shift() // Assistant takes first in queue

    // Simulate assistant preparing the order instantly
    let orderTotal = 0
    customerToHelp.orderItems.forEach((item) => {
      const menuItem = gameState.menuItems.find((mi) => mi.id === item.itemId)
      if (menuItem && menuItem.stock >= item.quantity) {
        menuItem.stock -= item.quantity
        orderTotal += menuItem.price * item.quantity
      } else {
        // Assistant couldn't fulfill due to stock, customer might leave or order partial
        console.log(`Assistant could not fully prepare ${item.name} for ${customerToHelp.name} due to stock.`)
        // For simplicity, let's say they still pay for what was available
      }
    })

    if (orderTotal > 0) {
      gameState.wallet += orderTotal
      gameState.xp += 5 // Less XP for assistant's work
      gameState.customersServedToday++
      // Assistant doesn't get tips or affect rating as much for simplicity
      updateGoalProgress("serve", 1)
      updateGoalProgress("earn", orderTotal)
      console.log(`Assistant served ${customerToHelp.name} for $${orderTotal.toFixed(2)}.`)
    }

    renderCustomerQueueVisual()
    renderMenuItems() // Update stock
    updateUI()
  }

  hireAssistantButton.addEventListener("click", () => {
    const cost = Number.parseInt(hireAssistantButton.dataset.cost)
    if (!gameState.upgrades.assistantHired && gameState.wallet >= cost) {
      if (gameState.availableAssistants && gameState.availableAssistants.length > 0) {
        gameState.wallet -= cost
        gameState.upgrades.assistantHired = true
        gameState.hiredAssistant = gameState.availableAssistants.shift() // Hire the first available
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

  upgradeEspressoMachineButton.addEventListener("click", () => {
    const currentLevel = gameState.upgrades.espressoMachine
    const cost = Number.parseInt(upgradeEspressoMachineButton.dataset.cost) * currentLevel
    if (gameState.wallet >= cost) {
      gameState.wallet -= cost
      gameState.upgrades.espressoMachine++
      alert(`Espresso Machine upgraded to Mk ${gameState.upgrades.espressoMachine}! Preparation times reduced.`)
      // Actual effect: reduce item.prepTime or challenge difficulty
      gameState.menuItems.forEach((item) => {
        if (item.prepTime) item.prepTime = Math.max(1, item.prepTime - 1)
      })
      updateUI()
    } else {
      alert("Not enough money for this upgrade!")
    }
  })

  function gameTick() {
    if (!shopOpen) return

    gameState.currentTime += 10 // 10 game minutes per real second
    if (gameState.currentTime >= 22 * 60) {
      // Shop closes at 10 PM (22:00)
      endCurrentDay()
      return
    }
    spawnCustomer()
    updateUI()
  }

  function endCurrentDay() {
    shopOpen = false
    shopStatusMessage.textContent = "Shop: CLOSED - Preparing Next Day..."
    alert(`Day ${gameState.day} ended! Customers served: ${gameState.customersServedToday}.`)

    // Calculate daily profit, etc. (can be expanded)
    const goalsMet = gameState.dailyGoals.every((g) => g.completed)
    if (goalsMet) {
      gameState.xp += 50 // Bonus for all goals
      gameState.wallet += 100
      alert("All daily goals met! Bonus: $100 and 50 XP!")
      checkLevelUp()
    }

    gameState.day++
    gameState.currentTime = 8 * 60 // Reset to 8 AM
    gameState.customersServedToday = 0
    customerQueue = []
    if (activeCustomer) {
      alert("Shop closed! Active customer sent home.")
      activeCustomer = null
    }
    // Reset daily goals
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
    // Short delay then reopen for next day
    setTimeout(() => {
      shopOpen = true
      updateUI()
    }, 3000) // 3 second delay
  }

  endDayButton.addEventListener("click", endCurrentDay)

  // --- Initialization ---
  updateUI() // Initial UI setup
  setInterval(gameTick, 1000) // Main game loop (1 real second)
  if (gameState.upgrades.assistantHired && !assistantInterval) {
    // If assistant was hired in save
    assistantInterval = setInterval(assistantHelps, ASSISTANT_HELP_INTERVAL)
  }
})
