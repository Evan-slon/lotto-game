// ===== КОНФИГУРАЦИЯ ИГРЫ =====
const GAME_CONFIG = {
    name: "Lucky Jetton",
    version: "1.0.0",
    currency: "TON",
    jettonSymbol: "LJT",
    pools: [
        {
            id: 1,
            name: "Стандартный",
            ticketPrice: 1,
            totalTickets: 1000,
            availableTickets: 850,
            soldTickets: 150,
            prizeFund: 700,
            prizeDistribution: {
                1: 0.35,
                2: 0.20,
                3: 0.10,
                4: 0.025,
                5: 0.025,
                6: 0.025,
                7: 0.025,
                8: 0.025,
                9: 0.025,
                10: 0.025,
                11: 0.0175,
                12: 0.0175,
                13: 0.0175,
                14: 0.0175,
                15: 0.0175,
                16: 0.0175,
                17: 0.0175,
                18: 0.0175,
                19: 0.0175,
                20: 0.0175
            },
            prizes: [
                245, 140, 70, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5,
                12.25, 12.25, 12.25, 12.25, 12.25, 12.25, 12.25, 12.25, 12.25, 12.25
            ],
            color: "#ff652f",
            isActive: true
        },
        {
            id: 2,
            name: "Премиум",
            ticketPrice: 5,
            totalTickets: 750,
            availableTickets: 600,
            soldTickets: 150,
            prizeFund: 2625,
            prizeDistribution: {
                1: 0.35,
                2: 0.20,
                3: 0.10,
                4: 0.025,
                5: 0.025,
                6: 0.025,
                7: 0.025,
                8: 0.025,
                9: 0.025,
                10: 0.025,
                11: 0.0175,
                12: 0.0175,
                13: 0.0175,
                14: 0.0175,
                15: 0.0175,
                16: 0.0175,
                17: 0.0175,
                18: 0.0175,
                19: 0.0175,
                20: 0.0175
            },
            prizes: [
                918.75, 525, 262.5, 65.63, 65.63, 65.63, 65.63, 65.63, 65.63, 65.63,
                45.94, 45.94, 45.94, 45.94, 45.94, 45.94, 45.94, 45.94, 45.94, 45.94
            ],
            color: "#ffe400",
            isActive: true
        },
        {
            id: 3,
            name: "Элитный",
            ticketPrice: 10,
            totalTickets: 500,
            availableTickets: 450,
            soldTickets: 50,
            prizeFund: 3500,
            prizeDistribution: {
                1: 0.35,
                2: 0.20,
                3: 0.10,
                4: 0.025,
                5: 0.025,
                6: 0.025,
                7: 0.025,
                8: 0.025,
                9: 0.025,
                10: 0.025,
                11: 0.0175,
                12: 0.0175,
                13: 0.0175,
                14: 0.0175,
                15: 0.0175,
                16: 0.0175,
                17: 0.0175,
                18: 0.0175,
                19: 0.0175,
                20: 0.0175
            },
            prizes: [
                1225, 700, 350, 87.5, 87.5, 87.5, 87.5, 87.5, 87.5, 87.5,
                61.25, 61.25, 61.25, 61.25, 61.25, 61.25, 61.25, 61.25, 61.25, 61.25
            ],
            color: "#14a76c",
            isActive: true
        }
    ],
    distribution: {
        prizeFund: 0.70,
        development: 0.10,
        liquidity: 0.10,
        operations: 0.10
    },
    jettonReward: 10,
};

// ===== СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====
const APP_STATE = {
    user: {
        isConnected: false,
        address: null,
        balance: 0,
        jettonBalance: 0,
        nickname: "Гость",
        avatarIndex: 1
    },
    currentPool: null,
    currentPage: 'home',
    selectedTickets: [],
    purchasedTickets: [],
    notifications: []
};

// ===== ИНИЦИАЛИЗАЦИЯ ДАННЫХ =====
function loadState() {
    const savedState = localStorage.getItem('luckyJettonState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        Object.assign(APP_STATE, parsedState);
        
        if (APP_STATE.purchasedTickets) {
            APP_STATE.purchasedTickets.forEach(ticket => {
                if (ticket.purchaseDate) {
                    ticket.purchaseDate = new Date(ticket.purchaseDate);
                }
            });
        }
    }
}

function saveState() {
    const stateToSave = {
        ...APP_STATE,
        purchasedTickets: APP_STATE.purchasedTickets.map(ticket => ({
            ...ticket,
            purchaseDate: ticket.purchaseDate ? ticket.purchaseDate.toISOString() : new Date().toISOString()
        }))
    };
    localStorage.setItem('luckyJettonState', JSON.stringify(stateToSave));
}

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С ПОЛЬЗОВАТЕЛЕМ =====
function connectWallet() {
    APP_STATE.user = {
        isConnected: true,
        address: "EQD...xyz" + Math.random().toString(36).substr(2, 6),
        balance: Math.floor(Math.random() * 1000) + 100,
        jettonBalance: Math.floor(Math.random() * 10000),
        nickname: "Игрок_" + Math.floor(Math.random() * 1000),
        avatarIndex: Math.floor(Math.random() * 5) + 1
    };
    
    saveState();
    return APP_STATE.user;
}

function disconnectWallet() {
    APP_STATE.user = {
        isConnected: false,
        address: null,
        balance: 0,
        jettonBalance: 0,
        nickname: "Гость",
        avatarIndex: 1
    };
    
    saveState();
    return APP_STATE.user;
}

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С БИЛЕТАМИ =====
function generateTicketNumbers(poolId, start, count) {
    const numbers = [];
    const pool = GAME_CONFIG.pools.find(p => p.id === poolId);
    const totalTickets = pool ? pool.totalTickets : 1000;
    
    for (let i = start; i < start + count && i <= totalTickets; i++) {
        const isSold = checkIfTicketSold(poolId, i);
        numbers.push({
            number: i,
            isSold: isSold,
            isSelected: false
        });
    }
    
    return numbers;
}

function checkIfTicketSold(poolId, ticketNumber) {
    if (!APP_STATE.purchasedTickets) return false;
    
    return APP_STATE.purchasedTickets.some(ticket => 
        ticket.poolId === poolId && ticket.number === ticketNumber
    );
}

function selectTicket(poolId, ticketNumber) {
    const ticketIndex = APP_STATE.selectedTickets.findIndex(t => 
        t.poolId === poolId && t.number === ticketNumber
    );
    
    if (ticketIndex === -1) {
        if (checkIfTicketSold(poolId, ticketNumber)) {
            return { success: false, message: "Этот билет уже продан" };
        }
        
        APP_STATE.selectedTickets.push({
            poolId: poolId,
            number: ticketNumber,
            timestamp: new Date()
        });
        return { success: true };
    } else {
        APP_STATE.selectedTickets.splice(ticketIndex, 1);
        return { success: true };
    }
}

function clearSelectedTickets() {
    APP_STATE.selectedTickets = [];
}

function purchaseTickets(poolId, ticketNumbers) {
    const pool = GAME_CONFIG.pools.find(p => p.id === poolId);
    if (!pool) {
        return { success: false, message: "Пул не найден" };
    }
    
    const totalCost = ticketNumbers.length * pool.ticketPrice;
    if (APP_STATE.user.balance < totalCost) {
        return { success: false, message: "Недостаточно средств" };
    }
    
    for (const ticketNumber of ticketNumbers) {
        if (checkIfTicketSold(poolId, ticketNumber)) {
            return { success: false, message: `Билет №${ticketNumber} уже продан` };
        }
    }
    
    const purchases = ticketNumbers.map(number => ({
        id: `ticket_${poolId}_${number}_${Date.now()}`,
        poolId: poolId,
        number: number,
        price: pool.ticketPrice,
        purchaseDate: new Date(),
        status: 'pending',
        winAmount: null,
        winPlace: null
    }));
    
    APP_STATE.purchasedTickets.push(...purchases);
    APP_STATE.user.balance -= totalCost;
    APP_STATE.user.jettonBalance += ticketNumbers.length * GAME_CONFIG.jettonReward;
    
    pool.soldTickets += ticketNumbers.length;
    pool.availableTickets -= ticketNumbers.length;
    
    APP_STATE.selectedTickets = APP_STATE.selectedTickets.filter(t => 
        !(t.poolId === poolId && ticketNumbers.includes(t.number))
    );
    
    saveState();
    
    return {
        success: true,
        purchases: purchases,
        totalCost: totalCost,
        jettonReward: ticketNumbers.length * GAME_CONFIG.jettonReward
    };
}

// ===== СТАТИСТИКА И РЕЙТИНГ =====
function getUserStats() {
    if (!APP_STATE.user.isConnected) {
        return {
            totalGames: 0,
            totalSpent: 0,
            totalWon: 0,
            averageTicketPrice: 0,
            favoritePool: null
        };
    }
    
    const userTickets = APP_STATE.purchasedTickets;
    
    const stats = {
        totalGames: userTickets.length,
        totalSpent: userTickets.reduce((sum, ticket) => sum + ticket.price, 0),
        totalWon: userTickets
            .filter(t => t.winAmount)
            .reduce((sum, ticket) => sum + ticket.winAmount, 0),
        ticketsByPool: {},
        lastPurchase: userTickets.length > 0 
            ? new Date(Math.max(...userTickets.map(t => new Date(t.purchaseDate)))) 
            : null
    };
    
    userTickets.forEach(ticket => {
        if (!stats.ticketsByPool[ticket.poolId]) {
            stats.ticketsByPool[ticket.poolId] = 0;
        }
        stats.ticketsByPool[ticket.poolId]++;
    });
    
    if (Object.keys(stats.ticketsByPool).length > 0) {
        stats.favoritePool = Object.keys(stats.ticketsByPool).reduce((a, b) => 
            stats.ticketsByPool[a] > stats.ticketsByPool[b] ? a : b
        );
    }
    
    stats.averageTicketPrice = stats.totalGames > 0 
        ? stats.totalSpent / stats.totalGames 
        : 0;
    
    return stats;
}

// ===== УТИЛИТЫ =====
function formatCurrency(amount, currency = GAME_CONFIG.currency) {
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount) + ' ' + currency;
}

function formatDate(date) {
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

function formatShortAddress(address) {
    if (!address) return '';
    return address.length > 20 
        ? `${address.substring(0, 10)}...${address.substring(address.length - 8)}`
        : address;
}

function getPoolProgress(poolId) {
    const pool = GAME_CONFIG.pools.find(p => p.id === poolId);
    if (!pool) return 0;
    
    return (pool.soldTickets / pool.totalTickets) * 100;
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
loadState();
