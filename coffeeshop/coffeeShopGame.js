document.addEventListener("DOMContentLoaded", () => {
  // Game state
  const gameState = {
    playerName: "",
    playerScore: 0,
    playerLevel: 1,
    wallet: 500.0,
    currentTime: 8 * 60, // 8:00 AM in minutes
    shopOpen: true,
    customersServed: 0,
    operatingHours: {
      open: { hour: 8, period: "AM" },
      close: { hour: 6, period: "PM" },
      days: ["M", "T", "W", "T2", "F"], // Weekdays open by default
    },
    menuItems: [
      { id: "coffee-cup", name: "Coffee Cup", price: 3.5, stock: 20, image: "../images/Coffee-Cup.png" },
      { id: "coffee-to-go", name: "Coffee To Go", price: 4.0, stock: 15, image: "../images/Coffee-To-Go.png" },
      { id: "sandwich", name: "Sandwich", price: 6.5, stock: 10, image: "../images/Sandwich.png" },
      { id: "chocolate-donut", name: "Chocolate Donut", price: 2.75, stock: 12, image: "../images/Chocolate-donut.png" },
      {
        id: "blueberry-donut",
        name: "Blueberry Donut",
        price: 2.75,
        stock: 12,
        image: "../images/Frosted-blueberry-donut.png",
      },
      { id: "chocolate-muffin", name: "Chocolate Muffin", price: 3.25, stock: 8, image: "../images/Chocolate-muffin.png" },
      { id: "pain-au-raisin", name: "Pain au Raisin", price: 3.75, stock: 6, image: "../images/Pain-au-raisin.png" },
      { id: "macarons", name: "Macarons", price: 5.5, stock: 15, image: "../images/Macarons.png" },
      { id: "croissant", name: "Croissant", price: 2.25, stock: 10, image: "../images/Croissant.png" },
    ],
    customers: [],
    customerSpawnRate: 3000, // Base spawn rate in milliseconds
  }

  // DOM elements
  const elements = {
    playerName: document.getElementById("playerName"),
    playerScore: document.getElementById("playerScore"),
    playerLevel: document.getElementById("playerLevel"),
    walletAmount: document.getElementById("walletAmount"),
    currentTime: document.getElementById("currentTime"),
    shopStatus: document.getElementById("shopStatus"),
    customersServed: document.getElementById("customersServed"),
    customerQueue: document.getElementById("customerQueue"),
    menuItems: document.getElementById("menuItems"),
    serveCustomerButton: document.getElementById("serveCustomerButton"),
    saveProgressButton: document.getElementById("saveProgressButton"),
    reorderAllButton: document.getElementById("reorderAllButton"),
    inventoryStatus: document.getElementById("inventoryStatus"),
  }

  // Initialize game
  function initGame() {
    loadPlayerData()
    setupDayButtons()
    setupTimeSelectors()
    renderMenuItems()
    updateDisplay()
    startGameLoop()
  }

  // Load player data from session storage
  function loadPlayerData() {
    const savedData = sessionStorage.getItem("coffeeShopGameSaveData")
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        gameState.playerName = data.playerName || "Player"
        gameState.playerScore = data.playerScore || 0
        gameState.wallet = data.wallet || 500.0
        gameState.playerLevel = data.playerLevel || 1
        if (data.menuItems) gameState.menuItems = data.menuItems
        if (data.operatingHours) gameState.operatingHours = data.operatingHours
      } catch (e) {
        console.error("Error loading save data:", e)
      }
    }
  }

  // Setup day toggle buttons
  function setupDayButtons() {
    const dayButtons = document.querySelectorAll(".day-btn")
    dayButtons.forEach((btn) => {
      const day = btn.dataset.day
      if (gameState.operatingHours.days.includes(day)) {
        btn.classList.add("active")
      }

      btn.addEventListener("click", () => {
        btn.classList.toggle("active")
        updateOperatingDays()
      })
    })
  }

  // Setup time selectors
  function setupTimeSelectors() {
    const openHour = document.getElementById("openHour")
    const openPeriod = document.getElementById("openPeriod")
    const closeHour = document.getElementById("closeHour")
    const closePeriod = document.getElementById("closePeriod")

    // Set initial values
    openHour.value = gameState.operatingHours.open.hour
    openPeriod.value = gameState.operatingHours.open.period
    closeHour.value = gameState.operatingHours.close.hour
    closePeriod.value = gameState.operatingHours.close.period

    // Add event listeners
    ;[openHour, openPeriod, closeHour, closePeriod].forEach((element) => {
      element.addEventListener("change", updateOperatingHours)
    })
  }

  // Update operating days
  function updateOperatingDays() {
    const activeDays = []
    document.querySelectorAll(".day-btn.active").forEach((btn) => {
      activeDays.push(btn.dataset.day)
    })
    gameState.operatingHours.days = activeDays
  }

  // Update operating hours
  function updateOperatingHours() {
    gameState.operatingHours.open.hour = Number.parseInt(document.getElementById("openHour").value)
    gameState.operatingHours.open.period = document.getElementById("openPeriod").value
    gameState.operatingHours.close.hour = Number.parseInt(document.getElementById("closeHour").value)
    gameState.operatingHours.close.period = document.getElementById("closePeriod").value
  }

  // Render menu items in right sidebar
  function renderMenuItems() {
    elements.menuItems.innerHTML = ""
    gameState.menuItems.forEach((item) => {
      const itemElement = document.createElement("div")
      itemElement.className = "menu-item"
      itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-controls">
                        $<input type="number" class="price-input" value="${item.price.toFixed(2)}" 
                               step="0.25" min="0.50" data-item-id="${item.id}">
                        <span class="stock-display">Stock: ${item.stock}</span>
                        <button class="reorder-btn" data-item-id="${item.id}">+5</button>
                    </div>
                </div>
            `
      elements.menuItems.appendChild(itemElement)
    })

    // Add event listeners for price changes
    document.querySelectorAll(".price-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        const itemId = e.target.dataset.itemId
        const newPrice = Number.parseFloat(e.target.value)
        updateItemPrice(itemId, newPrice)
      })
    })

    // Add event listeners for reorder buttons
    document.querySelectorAll(".reorder-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemId = e.target.dataset.itemId
        reorderItem(itemId, 5)
      })
    })
  }

  // Update item price and customer spawn rate
  function updateItemPrice(itemId, newPrice) {
    const item = gameState.menuItems.find((i) => i.id === itemId)
    if (item) {
      item.price = newPrice
      // Higher prices = slower customer spawn rate
      updateCustomerSpawnRate()
    }
  }

  // Update customer spawn rate based on average prices
  function updateCustomerSpawnRate() {
    const avgPrice = gameState.menuItems.reduce((sum, item) => sum + item.price, 0) / gameState.menuItems.length
    // Base rate 3000ms, increases with higher prices
    gameState.customerSpawnRate = 3000 + (avgPrice - 3.5) * 500
    gameState.customerSpawnRate = Math.max(1500, Math.min(8000, gameState.customerSpawnRate))
  }

  // Reorder item stock
  function reorderItem(itemId, quantity) {
    const item = gameState.menuItems.find((i) => i.id === itemId)
    const cost = quantity * 1.5 // $1.50 per item to restock

    if (item && gameState.wallet >= cost) {
      item.stock += quantity
      gameState.wallet -= cost
      updateDisplay()
      renderMenuItems()
    } else {
      alert("Not enough money to reorder!")
    }
  }

  // Spawn customer
  function spawnCustomer() {
    if (!gameState.shopOpen || gameState.customers.length >= 3) return

    const availableItems = gameState.menuItems.filter((item) => item.stock > 0)
    if (availableItems.length === 0) return

    const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)]
    const customer = {
      id: Date.now(),
      order: randomItem,
      patience: 10000, // 10 seconds patience
      image: Math.random() > 0.5 ? "../images/customer1.png" : "../images/customer2.png",
    }

    gameState.customers.push(customer)
    renderCustomers()

    // Remove customer after patience runs out
    setTimeout(() => {
      removeCustomer(customer.id)
    }, customer.patience)
  }

  // Render customers in queue
  function renderCustomers() {
    elements.customerQueue.innerHTML = ""
    gameState.customers.forEach((customer) => {
      const customerElement = document.createElement("div")
      customerElement.className = "customer"
      customerElement.innerHTML = `
                <img src="${customer.image}" alt="Customer">
                <div class="customer-order">${customer.order.name}</div>
            `
      customerElement.addEventListener("click", () => serveCustomer(customer.id))
      elements.customerQueue.appendChild(customerElement)
    })
  }

  // Serve customer
  function serveCustomer(customerId) {
    const customerIndex = gameState.customers.findIndex((c) => c.id === customerId)
    if (customerIndex === -1) return

    const customer = gameState.customers[customerIndex]
    const item = customer.order

    if (item.stock > 0) {
      // Reduce stock
      item.stock--

      // Add money and score
      gameState.wallet += item.price
      gameState.playerScore += Math.floor(item.price * 10)
      gameState.customersServed++

      // Remove customer
      gameState.customers.splice(customerIndex, 1)

      updateDisplay()
      renderCustomers()
      renderMenuItems()
    }
  }

  // Remove customer (when patience runs out)
  function removeCustomer(customerId) {
    const customerIndex = gameState.customers.findIndex((c) => c.id === customerId)
    if (customerIndex !== -1) {
      gameState.customers.splice(customerIndex, 1)
      renderCustomers()
    }
  }

  // Update display
  function updateDisplay() {
    elements.playerName.textContent = gameState.playerName
    elements.playerScore.textContent = gameState.playerScore
    elements.playerLevel.textContent = gameState.playerLevel
    elements.walletAmount.textContent = gameState.wallet.toFixed(2)
    elements.customersServed.textContent = gameState.customersServed

    // Update time display
    const hours = Math.floor(gameState.currentTime / 60)
    const minutes = gameState.currentTime % 60
    const period = hours >= 12 ? "PM" : "AM"
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    elements.currentTime.textContent = `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`

    elements.shopStatus.textContent = gameState.shopOpen ? "Open" : "Closed"
  }

  // Save progress
  function saveProgress() {
    const saveData = {
      playerName: gameState.playerName,
      playerScore: gameState.playerScore,
      playerLevel: gameState.playerLevel,
      wallet: gameState.wallet,
      customersServed: gameState.customersServed,
      menuItems: gameState.menuItems,
      operatingHours: gameState.operatingHours,
      lastSaved: new Date().toISOString(),
      gameType: "coffeeShop",
      version: "1.0",
    }

    sessionStorage.setItem("coffeeShopGameSaveData", JSON.stringify(saveData))

    // Visual feedback
    const originalText = elements.saveProgressButton.textContent
    elements.saveProgressButton.textContent = "Saved!"
    elements.saveProgressButton.style.backgroundColor = "#38a169"

    setTimeout(() => {
      elements.saveProgressButton.textContent = originalText
      elements.saveProgressButton.style.backgroundColor = ""
    }, 1500)
  }

  // Game loop
  function startGameLoop() {
    // Spawn customers
    setInterval(() => {
      if (Math.random() < 0.7) {
        // 70% chance to spawn
        spawnCustomer()
      }
    }, gameState.customerSpawnRate)

    // Update time every minute (game time)
    setInterval(() => {
      gameState.currentTime += 1
      if (gameState.currentTime >= 24 * 60) {
        gameState.currentTime = 0 // Reset to midnight
      }
      updateDisplay()
    }, 5000) // 5 seconds = 1 game minute

    // Auto-save every 30 seconds
    setInterval(saveProgress, 30000)
  }

  // Event listeners
  if (elements.serveCustomerButton) {
    elements.serveCustomerButton.addEventListener("click", () => {
      if (gameState.customers.length > 0) {
        serveCustomer(gameState.customers[0].id)
      }
    })
  }

  if (elements.saveProgressButton) {
    elements.saveProgressButton.addEventListener("click", saveProgress)
  }

  if (elements.reorderAllButton) {
    elements.reorderAllButton.addEventListener("click", () => {
      const totalCost = gameState.menuItems.length * 5 * 1.5
      if (gameState.wallet >= totalCost) {
        gameState.menuItems.forEach((item) => {
          item.stock += 5
        })
        gameState.wallet -= totalCost
        updateDisplay()
        renderMenuItems()
      } else {
        alert("Not enough money to reorder all items!")
      }
    })
  }

  // Initialize the game
  initGame()
})
