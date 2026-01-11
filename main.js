// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentPage = 'home';
let currentPoolId = null;
let currentTicketPage = 0;
const TICKETS_PER_PAGE = 25;

// ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    // Загрузка состояния
    loadState();
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Загрузка начальной страницы
    loadPage('home');
    
    // Показ приветственного уведомления
    setTimeout(() => {
        if (!APP_STATE.user.isConnected) {
            showNotification(
                'Подключите кошелек TON для участия в лотерее!', 
                'info', 
                8000
            );
        }
    }, 1000);
});

// ===== НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ =====
function setupEventListeners() {
    // Навигация
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            loadPage(page);
            
            // Обновляем активную кнопку
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Кнопка "Назад"
    $('#backButton').addEventListener('click', goBack);
    
    // Кнопка подключения кошелька
    $('#connectWalletBtn').addEventListener('click', handleWalletConnect);
}

// ===== УПРАВЛЕНИЕ НАВИГАЦИЕЙ =====
function loadPage(pageName) {
    currentPage = pageName;
    const contentArea = $('#pageContent');
    
    // Очищаем контент
    removeAllChildren(contentArea);
    
    // Скрываем/показываем кнопку "Назад" и нижнюю навигацию
    updateNavigationUI();
    
    // Загружаем соответствующую страницу
    switch(pageName) {
        case 'home':
            loadHomePage(contentArea);
            break;
        case 'pools':
            loadPoolsPage(contentArea);
            break;
        case 'my-tickets':
            loadMyTicketsPage(contentArea);
            break;
        case 'profile':
            loadProfilePage(contentArea);
            break;
        case 'rules':
            loadRulesPage(contentArea);
            break;
        case 'choose-tickets':
            loadChooseTicketsPage(contentArea);
            break;
        default:
            loadHomePage(contentArea);
    }
    
    // Обновляем URL
    history.pushState({ page: pageName, poolId: currentPoolId }, '', `#${pageName}`);
}

function updateNavigationUI() {
    const backButton = $('#backButton');
    const bottomNav = $('#bottomNav');
    
    if (currentPage === 'choose-tickets') {
        // В режиме выбора номеров показываем кнопку "Назад" и скрываем нижнюю навигацию
        showElement(backButton);
        hideElement(bottomNav);
    } else {
        // В обычном режиме скрываем кнопку "Назад" и показываем нижнюю навигацию
        hideElement(backButton);
        showElement(bottomNav);
        
        // Обновляем активную кнопку навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-page') === currentPage) {
                btn.classList.add('active');
            }
        });
    }
}

function goBack() {
    if (currentPage === 'choose-tickets') {
        // Возвращаемся к пулам
        currentPoolId = null;
        APP_STATE.selectedTickets = [];
        loadPage('pools');
    } else {
        // Возвращаемся на главную
        loadPage('home');
    }
}

// ===== СТРАНИЦА "ГЛАВНАЯ" =====
function loadHomePage(container) {
    const page = createElement('div', ['page', 'home-page']);
    
    page.innerHTML = `
        <h1 class="page-title">Добро пожаловать в Lucky Jetton!</h1>
        <p class="page-subtitle">
            Уникальная лотерея на блокчейне TON с прозрачными розыгрышами и крупными призами.
            Выбирайте пул, покупайте билеты и выигрывайте!
        </p>
        
        <div class="pools-container mt-3">
            <h2>Доступные пулы</h2>
            ${generatePoolCards(true)}
        </div>
        
        <div class="stats-grid mt-3">
            <div class="stat-card">
                <i class="fas fa-users"></i>
                <div class="stat-card-title">Активных игроков</div>
                <div class="stat-card-value">1,247</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-trophy"></i>
                <div class="stat-card-title">Разыграно призов</div>
                <div class="stat-card-value">${formatCurrency(15420)}</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-ticket-alt"></i>
                <div class="stat-card-title">Продано билетов</div>
                <div class="stat-card-value">45,892</div>
            </div>
        </div>
    `;
    
    container.appendChild(page);
    setupPoolCardListeners();
}

// ===== СТРАНИЦА "ПУЛЫ" =====
function loadPoolsPage(container) {
    const page = createElement('div', ['page', 'pools-page']);
    
    page.innerHTML = `
        <h1 class="page-title">Лотерейные пулы</h1>
        <p class="page-subtitle">
            Выберите пул для участия в лотерее. Каждый пул имеет разную стоимость билета и призовой фонд.
        </p>
        
        <div class="pools-container mt-3">
            ${generatePoolCards()}
        </div>
        
        <div class="info-box mt-3">
            <h3><i class="fas fa-info-circle"></i> Как это работает?</h3>
            <p>1. Выберите пул с подходящей стоимостью билета</p>
            <p>2. Выберите номера билетов (от 1 до нескольких)</p>
            <p>3. Оплатите выбранные билеты</p>
            <p>4. Дождитесь розыгрыша после продажи всех билетов в пуле</p>
            <p>5. Проверьте результаты в разделе "Мои билеты"</p>
        </div>
    `;
    
    container.appendChild(page);
    setupPoolCardListeners();
}

function generatePoolCards(compact = false) {
    let html = '';
    
    GAME_CONFIG.pools.forEach(pool => {
        const progress = getPoolProgress(pool.id);
        
        html += `
            <div class="pool-card" data-pool-id="${pool.id}">
                <div class="pool-header">
                    <h3 class="pool-title">${pool.name}</h3>
                    <div class="pool-price">${pool.ticketPrice} TON</div>
                </div>
                
                <div class="pool-stats">
                    <div class="stat-item">
                        <div class="stat-label">Всего билетов</div>
                        <div class="stat-value">${pool.totalTickets}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Доступно</div>
                        <div class="stat-value">${pool.availableTickets}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Призовой фонд</div>
                        <div class="stat-value">${formatCurrency(pool.prizeFund)}</div>
                    </div>
                    ${!compact ? `
                    <div class="stat-item">
                        <div class="stat-label">Продано</div>
                        <div class="stat-value">${pool.soldTickets}</div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="pool-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>Прогресс: ${progress.toFixed(1)}%</span>
                        <span>${pool.soldTickets} / ${pool.totalTickets}</span>
                    </div>
                </div>
                
                ${!compact ? `
                <div class="pool-actions">
                    <button class="btn btn-primary select-pool-btn" data-pool-id="${pool.id}">
                        <i class="fas fa-ticket-alt"></i> Выбрать номера
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    });
    
    return html;
}

function setupPoolCardListeners() {
    // Клик по карточке пула
    document.querySelectorAll('.pool-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.select-pool-btn')) {
                const poolId = parseInt(this.getAttribute('data-pool-id'));
                enterPool(poolId);
            }
        });
    });
    
    // Кнопки "Выбрать номера"
    document.querySelectorAll('.select-pool-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const poolId = parseInt(this.getAttribute('data-pool-id'));
            enterPool(poolId);
        });
    });
}

function enterPool(poolId) {
    currentPoolId = poolId;
    currentTicketPage = 0;
    APP_STATE.selectedTickets = [];
    loadPage('choose-tickets');
}

// ===== СТРАНИЦА ВЫБОРА НОМЕРОВ =====
function loadChooseTicketsPage(container) {
    if (!currentPoolId) {
        loadPoolsPage(container);
        return;
    }
    
    const pool = GAME_CONFIG.pools.find(p => p.id === currentPoolId);
    if (!pool) return;
    
    const page = createElement('div', ['page', 'choose-tickets-page']);
    
    page.innerHTML = `
        <div class="tickets-page-header">
            <div class="pool-header-info">
                <div>
                    <h1 class="page-title">${pool.name}</h1>
                    <p class="page-subtitle">Выбор номеров билетов</p>
                </div>
                <div class="pool-info-badge">
                    <div class="pool-info-item">
                        <div class="pool-info-label">Цена билета</div>
                        <div class="pool-info-value">${pool.ticketPrice} TON</div>
                    </div>
                    <div class="pool-info-item">
                        <div class="pool-info-label">Доступно</div>
                        <div class="pool-info-value">${pool.availableTickets} / ${pool.totalTickets}</div>
                    </div>
                    <div class="pool-info-item">
                        <div class="pool-info-label">Призовой фонд</div>
                        <div class="pool-info-value">${formatCurrency(pool.prizeFund)}</div>
                    </div>
                </div>
            </div>
            
            <div class="pool-prize-info">
                <p>🏆 Главный приз: <span class="prize-amount">${formatCurrency(pool.prizes[0])}</span></p>
            </div>
        </div>
        
        <div class="tickets-section">
            <div class="tickets-navigation">
                <button class="nav-arrow prev-page-btn" ${currentTicketPage === 0 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                <div class="current-page-indicator">
                    Страница ${currentTicketPage + 1} • 
                    Номера ${currentTicketPage * TICKETS_PER_PAGE + 1} - 
                    ${Math.min((currentTicketPage + 1) * TICKETS_PER_PAGE, pool.totalTickets)}
                </div>
                
                <button class="nav-arrow next-page-btn" 
                    ${(currentTicketPage + 1) * TICKETS_PER_PAGE >= pool.totalTickets ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <div class="tickets-grid" id="ticketsGrid">
                <!-- Билеты будут сгенерированы динамически -->
            </div>
        </div>
        
        <div class="buy-panel" id="buyPanel">
            <div class="buy-panel-content">
                <div class="selected-info-row">
                    <div class="selected-count">
                        Выбрано: <span id="selectedCount">0</span> билетов
                    </div>
                    <div class="total-price">
                        Итого: <span id="totalPrice">0</span> TON
                    </div>
                </div>
                <div class="buy-actions">
                    <button class="btn btn-secondary" id="clearSelectionBtn">
                        <i class="fas fa-times"></i> Очистить
                    </button>
                    <button class="btn btn-primary" id="buyTicketsBtn" disabled>
                        <i class="fas fa-shopping-cart"></i> Купить билеты
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(page);
    
    // Генерируем билеты
    generateTicketsForPage();
    
    // Обновляем панель покупки
    updateBuyPanel();
    
    // Настраиваем обработчики
    setupChooseTicketsListeners();
}

function generateTicketsForPage() {
    const ticketsGrid = $('#ticketsGrid');
    if (!ticketsGrid) return;
    
    removeAllChildren(ticketsGrid);
    
    const pool = GAME_CONFIG.pools.find(p => p.id === currentPoolId);
    if (!pool) return;
    
    const startNumber = currentTicketPage * TICKETS_PER_PAGE + 1;
    const endNumber = Math.min((currentTicketPage + 1) * TICKETS_PER_PAGE, pool.totalTickets);
    
    for (let i = startNumber; i <= endNumber; i++) {
        const ticketElement = createElement('div', ['ticket-number']);
        ticketElement.textContent = i;
        ticketElement.setAttribute('data-number', i);
        
        // Проверяем статус билета
        const isSold = checkIfTicketSold(currentPoolId, i);
        const isSelected = APP_STATE.selectedTickets.some(t => 
            t.poolId === currentPoolId && t.number === i
        );
        
        if (isSold) {
            ticketElement.classList.add('sold');
            ticketElement.title = 'Билет уже продан';
        } else if (isSelected) {
            ticketElement.classList.add('selected');
        }
        
        if (!isSold) {
            ticketElement.addEventListener('click', () => toggleTicketSelection(i));
        }
        
        ticketsGrid.appendChild(ticketElement);
    }
}

function setupChooseTicketsListeners() {
    // Навигация по страницам
    $('.prev-page-btn')?.addEventListener('click', () => {
        if (currentTicketPage > 0) {
            currentTicketPage--;
            generateTicketsForPage();
            updateBuyPanel();
            updateNavigationButtons();
        }
    });
    
    $('.next-page-btn')?.addEventListener('click', () => {
        const pool = GAME_CONFIG.pools.find(p => p.id === currentPoolId);
        if (!pool) return;
        
        if ((currentTicketPage + 1) * TICKETS_PER_PAGE < pool.totalTickets) {
            currentTicketPage++;
            generateTicketsForPage();
            updateBuyPanel();
            updateNavigationButtons();
        }
    });
    
    // Кнопки покупки и очистки
    $('#buyTicketsBtn')?.addEventListener('click', handleTicketPurchase);
    $('#clearSelectionBtn')?.addEventListener('click', clearSelection);
}

function updateNavigationButtons() {
    const pool = GAME_CONFIG.pools.find(p => p.id === currentPoolId);
    if (!pool) return;
    
    const prevBtn = $('.prev-page-btn');
    const nextBtn = $('.next-page-btn');
    const pageIndicator = $('.current-page-indicator');
    
    if (prevBtn) {
        prevBtn.disabled = currentTicketPage === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = (currentTicketPage + 1) * TICKETS_PER_PAGE >= pool.totalTickets;
    }
    
    if (pageIndicator) {
        pageIndicator.textContent = 
            `Страница ${currentTicketPage + 1} • ` +
            `Номера ${currentTicketPage * TICKETS_PER_PAGE + 1} - ` +
            `${Math.min((currentTicketPage + 1) * TICKETS_PER_PAGE, pool.totalTickets)}`;
    }
}

function toggleTicketSelection(ticketNumber) {
    if (!currentPoolId) return;
    
    const result = selectTicket(currentPoolId, ticketNumber);
    
    if (result.success) {
        // Обновляем отображение билета
        const ticketElement = $(`[data-number="${ticketNumber}"]`);
        if (ticketElement) {
            ticketElement.classList.toggle('selected');
        }
        
        // Обновляем панель покупки
        updateBuyPanel();
        
        // Анимация
        if (ticketElement) {
            ticketElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                ticketElement.style.transform = 'scale(1)';
            }, 200);
        }
    } else {
        showNotification(result.message, 'error');
    }
}

function clearSelection() {
    if (!currentPoolId) return;
    
    APP_STATE.selectedTickets = APP_STATE.selectedTickets.filter(t => t.poolId !== currentPoolId);
    generateTicketsForPage();
    updateBuyPanel();
}

function updateBuyPanel() {
    if (!currentPoolId) return;
    
    const pool = GAME_CONFIG.pools.find(p => p.id === currentPoolId);
    if (!pool) return;
    
    const selectedInPool = APP_STATE.selectedTickets.filter(t => t.poolId === currentPoolId);
    const selectedCount = selectedInPool.length;
    const totalPrice = selectedCount * pool.ticketPrice;
    
    const selectedCountElement = $('#selectedCount');
    const totalPriceElement = $('#totalPrice');
    const buyButton = $('#buyTicketsBtn');
    const buyPanel = $('#buyPanel');
    
    if (selectedCountElement) {
        selectedCountElement.textContent = selectedCount;
    }
    
    if (totalPriceElement) {
        totalPriceElement.textContent = formatCurrency(totalPrice);
    }
    
    if (buyButton) {
        buyButton.disabled = selectedCount === 0 || !APP_STATE.user.isConnected;
        buyButton.innerHTML = selectedCount > 0 
            ? `<i class="fas fa-shopping-cart"></i> Купить ${selectedCount} билет(ов)`
            : `<i class="fas fa-shopping-cart"></i> Купить билеты`;
    }
    
    // Показываем/скрываем панель покупки
    if (buyPanel) {
        if (selectedCount > 0) {
            showElement(buyPanel);
        } else {
            hideElement(buyPanel);
        }
    }
}

// ===== СТРАНИЦА "МОИ БИЛЕТЫ" =====
function loadMyTicketsPage(container) {
    const page = createElement('div', ['page', 'my-tickets-page']);
    
    if (!APP_STATE.user.isConnected) {
        page.innerHTML = `
            <h1 class="page-title">Мои билеты</h1>
            <p class="page-subtitle">Для просмотра ваших билетов подключите кошелек TON</p>
            <button class="btn btn-primary mt-2" id="connectFromTicketsBtn">
                <i class="fas fa-wallet"></i> Подключить кошелек
            </button>
        `;
        
        container.appendChild(page);
        
        $('#connectFromTicketsBtn')?.addEventListener('click', handleWalletConnect);
        return;
    }
    
    const userTickets = APP_STATE.purchasedTickets;
    
    page.innerHTML = `
        <h1 class="page-title">Мои билеты</h1>
        
        <div class="my-tickets-container mt-3">
            ${userTickets.length === 0 ? 
                '<p class="text-center">У вас пока нет купленных билетов.</p>' : 
                generateTicketsList(userTickets)}
        </div>
    `;
    
    container.appendChild(page);
}

function generateTicketsList(tickets) {
    let html = '';
    
    // Группируем билеты по пулам
    const ticketsByPool = {};
    tickets.forEach(ticket => {
        if (!ticketsByPool[ticket.poolId]) {
            ticketsByPool[ticket.poolId] = [];
        }
        ticketsByPool[ticket.poolId].push(ticket);
    });
    
    // Сортируем по дате покупки (новые сначала)
    Object.keys(ticketsByPool).forEach(poolId => {
        ticketsByPool[poolId].sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
    });
    
    // Генерируем HTML
    Object.keys(ticketsByPool).forEach(poolId => {
        const pool = GAME_CONFIG.pools.find(p => p.id === parseInt(poolId));
        if (!pool) return;
        
        html += `
            <div class="pool-section mb-3">
                <h3>${pool.name} (${pool.ticketPrice} TON)</h3>
        `;
        
        ticketsByPool[poolId].forEach(ticket => {
            const statusClass = ticket.status === 'won' ? 'status-won' : 
                              ticket.status === 'lost' ? 'status-lost' : 'status-pending';
            const statusText = ticket.status === 'won' ? 'Выигрыш' : 
                             ticket.status === 'lost' ? 'Не выиграл' : 'Ожидание розыгрыша';
            
            html += `
                <div class="ticket-item">
                    <div class="ticket-info">
                        <h4>Билет №${ticket.number}</h4>
                        <div class="ticket-meta">
                            <span>Куплен: ${formatDate(ticket.purchaseDate)}</span>
                            <span class="ticket-status ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                    <div class="ticket-amount">
                        ${ticket.winAmount ? 
                            `<strong class="text-green">+${formatCurrency(ticket.winAmount)}</strong>` : 
                            `<span>${formatCurrency(ticket.price)}</span>`}
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    return html;
}

// ===== СТРАНИЦА "ПРОФИЛЬ" =====
function loadProfilePage(container) {
    const page = createElement('div', ['page', 'profile-page']);
    
    if (!APP_STATE.user.isConnected) {
        page.innerHTML = `
            <h1 class="page-title">Личный кабинет</h1>
            <p class="page-subtitle">Для доступа к личному кабинету подключите кошелек TON</p>
            <button class="btn btn-primary mt-2" id="connectFromProfileBtn">
                <i class="fas fa-wallet"></i> Подключить кошелек
            </button>
        `;
        
        container.appendChild(page);
        
        $('#connectFromProfileBtn')?.addEventListener('click', handleWalletConnect);
        return;
    }
    
    const userStats = getUserStats();
    
    page.innerHTML = `
        <div class="profile-header">
            <div class="avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="user-info">
                <h2>${APP_STATE.user.nickname}</h2>
                <div class="user-address">${APP_STATE.user.address}</div>
                <div class="user-balances mt-1">
                    <div class="balance-item">
                        <span class="balance-label">Баланс TON:</span>
                        <span class="balance-value">${formatCurrency(APP_STATE.user.balance)}</span>
                    </div>
                    <div class="balance-item">
                        <span class="balance-label">Баланс LJT:</span>
                        <span class="balance-value">${APP_STATE.user.jettonBalance} LJT</span>
                    </div>
                </div>
            </div>
        </div>
        
        <h2 class="section-title">Статистика</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <i class="fas fa-gamepad"></i>
                <div class="stat-card-title">Сыграно игр</div>
                <div class="stat-card-value">${userStats.totalGames}</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-coins"></i>
                <div class="stat-card-title">Потрачено</div>
                <div class="stat-card-value">${formatCurrency(userStats.totalSpent)}</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-trophy"></i>
                <div class="stat-card-title">Выиграно</div>
                <div class="stat-card-value">${formatCurrency(userStats.totalWon)}</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-chart-line"></i>
                <div class="stat-card-title">Средний чек</div>
                <div class="stat-card-value">${formatCurrency(userStats.averageTicketPrice)}</div>
            </div>
        </div>
        
        <div class="profile-actions mt-3">
            <button class="btn btn-secondary" id="disconnectWalletBtn">
                <i class="fas fa-sign-out-alt"></i> Отключить кошелек
            </button>
        </div>
    `;
    
    container.appendChild(page);
    
    $('#disconnectWalletBtn')?.addEventListener('click', handleWalletDisconnect);
}

// ===== СТРАНИЦА "ПРАВИЛА" =====
function loadRulesPage(container) {
    const page = createElement('div', ['page', 'rules-page']);
    
    page.innerHTML = `
        <h1 class="page-title">Правила игры</h1>
        
        <div class="rules-container">
            <div class="rules-section">
                <h2><i class="fas fa-info-circle"></i> Общие положения</h2>
                <div class="rules-list">
                    <div class="rule-item">
                        <div class="rule-number">1</div>
                        <div class="rule-text">
                            Lucky Jetton — это прозрачная лотерея на блокчейне TON.
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">2</div>
                        <div class="rule-text">
                            Для участия необходимо подключить кошелек TON и приобрести билеты.
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">3</div>
                        <div class="rule-text">
                            Каждый билет имеет уникальный номер в пределах выбранного пула.
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="rules-section">
                <h2><i class="fas fa-percentage"></i> Распределение средств</h2>
                <div class="rules-list">
                    <div class="rule-item">
                        <div class="rule-number">1</div>
                        <div class="rule-text">
                            <strong>70%</strong> — призовой фонд
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">2</div>
                        <div class="rule-text">
                            <strong>10%</strong> — развитие проекта
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">3</div>
                        <div class="rule-text">
                            <strong>10%</strong> — ликвидность токена LJT
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">4</div>
                        <div class="rule-text">
                            <strong>10%</strong> — операционные расходы
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="rules-section">
                <h2><i class="fas fa-trophy"></i> Призы</h2>
                <div class="rules-list">
                    <div class="rule-item">
                        <div class="rule-number">1</div>
                        <div class="rule-text">
                            В каждом пуле разыгрывается <strong>20 призовых мест</strong>.
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">2</div>
                        <div class="rule-text">
                            <strong>1 место:</strong> 35% от призового фонда
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">3</div>
                        <div class="rule-text">
                            <strong>2 место:</strong> 20% от призового фонда
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">4</div>
                        <div class="rule-text">
                            <strong>3 место:</strong> 10% от призового фонда
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">5</div>
                        <div class="rule-text">
                            <strong>4-10 места:</strong> по 2.5% от призового фонда
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">6</div>
                        <div class="rule-text">
                            <strong>11-20 места:</strong> по 1.75% от призового фонда
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(page);
}

// ===== ОБРАБОТКА ПОКУПКИ БИЛЕТОВ =====
async function handleTicketPurchase() {
    if (!APP_STATE.user.isConnected) {
        showNotification('Сначала подключите кошелек TON', 'error');
        return;
    }
    
    if (!currentPoolId) {
        showNotification('Не выбран пул для покупки', 'error');
        return;
    }
    
    const selectedInPool = APP_STATE.selectedTickets.filter(t => t.poolId === currentPoolId);
    if (selectedInPool.length === 0) {
        showNotification('Не выбрано ни одного билета', 'warning');
        return;
    }
    
    const pool = GAME_CONFIG.pools.find(p => p.id === currentPoolId);
    if (!pool) return;
    
    const ticketNumbers = selectedInPool.map(t => t.number);
    const totalCost = ticketNumbers.length * pool.ticketPrice;
    
    // Модальное окно подтверждения
    showModal(
        'Подтверждение покупки',
        `
        <div class="purchase-confirmation">
            <p>Вы собираетесь приобрести <strong>${ticketNumbers.length} билет(ов)</strong> в пуле "${pool.name}".</p>
            <p><strong>Номера билетов:</strong> ${ticketNumbers.sort((a, b) => a - b).join(', ')}</p>
            <div class="price-summary mt-2">
                <div>Стоимость одного билета: ${pool.ticketPrice} TON</div>
                <div>Общая стоимость: <strong>${formatCurrency(totalCost)}</strong></div>
                <div>Будет начислено: <strong>${ticketNumbers.length * GAME_CONFIG.jettonReward} LJT</strong></div>
            </div>
            <p class="warning-text mt-2"><i class="fas fa-exclamation-triangle"></i> После подтверждения отменить покупку будет невозможно.</p>
        </div>
        `,
        [
            {
                text: 'Отмена',
                type: 'secondary',
                closeOnClick: true
            },
            {
                text: 'Подтвердить покупку',
                type: 'primary',
                onClick: () => processPurchase(ticketNumbers),
                closeOnClick: false
            }
        ]
    );
}

async function processPurchase(ticketNumbers) {
    try {
        const result = purchaseTickets(currentPoolId, ticketNumbers);
        
        if (result.success) {
            // Сначала закрываем модальное окно подтверждения
            closeModal();
            
            // Показываем уведомление
            showNotification(
                `Успешно приобретено ${ticketNumbers.length} билет(ов)! Начислено ${result.jettonReward} LJT.`,
                'success'
            );
            
            // Обновляем интерфейс
            updateWalletInfo();
            generateTicketsForPage();
            updateBuyPanel();
            
            // Показываем модальное окно с деталями покупки с небольшой задержкой
            setTimeout(() => {
                showModal(
                    'Покупка успешно завершена',
                    `
                    <div class="purchase-success">
                        <div class="success-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <p>Билеты успешно приобретены!</p>
                        <div class="purchase-details mt-2">
                            <div><strong>Номера билетов:</strong> ${ticketNumbers.sort((a, b) => a - b).join(', ')}</div>
                            <div><strong>Пул:</strong> ${GAME_CONFIG.pools.find(p => p.id === currentPoolId)?.name}</div>
                            <div><strong>Сумма покупки:</strong> ${formatCurrency(result.totalCost)}</div>
                            <div><strong>Начислено LJT:</strong> ${result.jettonReward}</div>
                        </div>
                        <p class="hint-text mt-2">Билеты теперь отображаются в разделе "Мои билеты".</p>
                    </div>
                    `,
                    [
                        {
                            text: 'Продолжить выбор',
                            type: 'primary',
                            onClick: () => {
                                // Просто закрываем модальное окно
                                closeModal();
                            },
                            closeOnClick: true
                        },
                        {
                            text: 'Перейти к моим билетам',
                            type: 'secondary',
                            onClick: () => {
                                // Загружаем страницу с билетами
                                loadPage('my-tickets');
                            }
                        }
                    ]
                );
            }, 300);
            
        } else {
            // Если покупка не удалась, показываем ошибку
            showNotification(result.message, 'error');
            // Не закрываем модальное окно - пусть пользователь видит ошибку
        }
    } catch (error) {
        console.error('Ошибка при покупке билетов:', error);
        showNotification('Произошла ошибка при покупке билетов', 'error');
        closeModal(); // Закрываем модальное окно в случае ошибки
    }
}

// ===== УПРАВЛЕНИЕ КОШЕЛЬКОМ =====
async function handleWalletConnect() {
    try {
        const user = connectWallet();
        
        updateWalletInfo();
        
        showNotification(
            `Кошелек успешно подключен! Приветствуем, ${user.nickname}!`,
            'success'
        );
        
        // Перезагружаем текущую страницу
        loadPage(currentPage);
        
    } catch (error) {
        console.error('Ошибка подключения кошелька:', error);
        showNotification('Не удалось подключить кошелек', 'error');
    }
}

async function handleWalletDisconnect() {
    if (!confirm('Вы уверены, что хотите отключить кошелек?')) {
        return;
    }
    
    try {
        disconnectWallet();
        updateWalletInfo();
        
        showNotification('Кошелек отключен', 'info');
        
        loadPage(currentPage);
        
    } catch (error) {
        console.error('Ошибка отключения кошелька:', error);
        showNotification('Не удалось отключить кошелек', 'error');
    }
}

function updateWalletInfo() {
    const connectBtn = $('#connectWalletBtn');
    const walletInfo = $('#walletInfo');
    
    if (APP_STATE.user.isConnected) {
        hideElement(connectBtn);
        
        if (walletInfo) {
            showElement(walletInfo);
            walletInfo.querySelector('.wallet-address').textContent = 
                formatShortAddress(APP_STATE.user.address);
            walletInfo.querySelector('.wallet-balance').textContent = 
                `${formatCurrency(APP_STATE.user.balance)}`;
        }
    } else {
        showElement(connectBtn);
        if (walletInfo) hideElement(walletInfo);
    }
}

// ===== ОБРАБОТКА ИСТОРИИ БРАУЗЕРА =====
window.addEventListener('popstate', function(event) {
    if (event.state) {
        currentPage = event.state.page;
        currentPoolId = event.state.poolId || null;
        loadPage(currentPage);
    }
});

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
// Делаем функции доступными для отладки
window.LuckyJetton = {
    APP_STATE,
    GAME_CONFIG,
    loadPage,
    showNotification
};

console.log('Lucky Jetton инициализирован! Для отладки используйте LuckyJetton в консоли.');
