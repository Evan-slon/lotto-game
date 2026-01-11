// ===== DOM УТИЛИТЫ =====
function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function createElement(tag, classes = [], attributes = {}) {
    const element = document.createElement(tag);
    
    if (classes.length > 0) {
        element.classList.add(...classes);
    }
    
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    
    return element;
}

function removeAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function toggleClass(element, className) {
    element.classList.toggle(className);
}

function showElement(element) {
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}

// ===== УТИЛИТЫ ДЛЯ РАБОТЫ С МОДАЛЬНЫМИ ОКНАМИ =====
let currentModal = null;

function showModal(title, content, buttons = []) {
    if (currentModal) {
        closeModal();
    }
    
    const modalOverlay = createElement('div', ['modal-overlay']);
    modalOverlay.id = 'modalOverlay';
    
    const modalContent = createElement('div', ['modal-content']);
    
    const modalHeader = createElement('div', ['modal-header']);
    const modalTitle = createElement('h2', ['modal-title']);
    modalTitle.textContent = title;
    
    const closeButton = createElement('button', ['modal-close']);
    closeButton.innerHTML = '&times;';
    closeButton.onclick = closeModal;
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    const modalBody = createElement('div', ['modal-body']);
    
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        modalBody.appendChild(content);
    } else if (typeof content === 'function') {
        const contentElement = content();
        if (contentElement) {
            modalBody.appendChild(contentElement);
        }
    }
    
    if (buttons.length > 0) {
        const modalActions = createElement('div', ['modal-actions']);
        
        buttons.forEach(buttonConfig => {
            const button = createElement('button', ['btn', ...(buttonConfig.classes || [])]);
            button.textContent = buttonConfig.text;
            
            if (buttonConfig.type === 'primary') {
                button.classList.add('btn-primary');
            } else if (buttonConfig.type === 'secondary') {
                button.classList.add('btn-secondary');
            }
            
            button.onclick = (e) => {
                if (buttonConfig.onClick) {
                    buttonConfig.onClick(e);
                }
                if (buttonConfig.closeOnClick !== false) {
                    closeModal();
                }
            };
            
            modalActions.appendChild(button);
        });
        
        modalBody.appendChild(modalActions);
    }
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalOverlay.appendChild(modalContent);
    
    $('#modalContainer').appendChild(modalOverlay);
    
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    currentModal = modalOverlay;
    
    setTimeout(() => {
        modalOverlay.style.opacity = '1';
    }, 10);
    
    return modalOverlay;
}

function closeModal() {
    if (!currentModal) return;
    
    currentModal.style.opacity = '0';
    
    setTimeout(() => {
        if (currentModal && currentModal.parentNode) {
            currentModal.parentNode.removeChild(currentModal);
        }
        currentModal = null;
        document.removeEventListener('keydown', handleEscapeKey);
    }, 300);
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
}

// ===== УТИЛИТЫ ДЛЯ УВЕДОМЛЕНИЙ =====
function showNotification(message, type = 'success', duration = 5000) {
    const notification = createElement('div', ['notification', type]);
    
    const icon = createElement('div', ['notification-icon']);
    let iconClass = '';
    
    switch (type) {
        case 'success':
            iconClass = 'fas fa-check-circle';
            break;
        case 'error':
            iconClass = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle';
            break;
        default:
            iconClass = 'fas fa-info-circle';
    }
    
    const iconElement = createElement('i', iconClass.split(' '));
    icon.appendChild(iconElement);
    
    const text = createElement('div', ['notification-text']);
    text.textContent = message;
    
    const closeBtn = createElement('button', ['notification-close']);
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => removeNotification(notification);
    
    notification.appendChild(icon);
    notification.appendChild(text);
    notification.appendChild(closeBtn);
    
    $('#notificationContainer').appendChild(notification);
    
    if (duration > 0) {
        setTimeout(() => {
            removeNotification(notification);
        }, duration);
    }
    
    return notification;
}

function removeNotification(notification) {
    if (notification.parentNode) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// ===== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
