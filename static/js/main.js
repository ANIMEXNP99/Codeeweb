// Main JavaScript file for CoderX Cyberpunk AI Chat

document.addEventListener('DOMContentLoaded', function() {
    // Cyberpunk grid background generation
    generateCyberpunkGrid();
    
    // Text animation for splash intro if on the homepage
    const heroTextElement = document.querySelector('.hero-text');
    if (heroTextElement) {
        animateTrail(heroTextElement.querySelector('h1'));
    }
    
    // Initialize cursor trails
    initCursorTrails();
    
    // Add glitch effect to navigation links on hover
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.classList.add('glitch-text');
        });
        link.addEventListener('mouseleave', function() {
            this.classList.remove('glitch-text');
        });
    });
    
    // Initialize any cyberpunk-styled forms
    initCyberpunkForms();
});

// Generate the cyberpunk grid background
function generateCyberpunkGrid() {
    const gridContainer = document.querySelector('.cyberpunk-grid-bg');
    if (!gridContainer) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Clear any existing grid
    gridContainer.innerHTML = '';
    
    // Create grid cells
    const cellSize = 50; // Size of each grid cell
    const numCellsX = Math.ceil(viewportWidth / cellSize);
    const numCellsY = Math.ceil(viewportHeight / cellSize);
    
    for (let y = 0; y < numCellsY; y++) {
        for (let x = 0; x < numCellsX; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            cell.style.left = `${x * cellSize}px`;
            cell.style.top = `${y * cellSize}px`;
            
            // Add some randomization for a more organic feel
            if (Math.random() > 0.7) {
                const hue = Math.random() > 0.5 ? '#9D4EDD' : (Math.random() > 0.5 ? '#00FF9F' : '#FF10F0');
                cell.style.borderColor = hue;
                cell.style.opacity = (0.05 + Math.random() * 0.1).toString();
            }
            
            gridContainer.appendChild(cell);
        }
    }
    
    // Make the grid responsive
    window.addEventListener('resize', function() {
        generateCyberpunkGrid();
    });
}

// Text animation for hero sections
function animateTrail(element) {
    if (!element) return;
    
    const text = element.textContent;
    element.textContent = '';
    element.style.opacity = '1';
    
    let i = 0;
    const speed = 50; // Speed of the typing effect
    
    function typeWriter() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        } else {
            // Add blinking cursor at the end
            const cursor = document.createElement('span');
            cursor.textContent = '|';
            cursor.className = 'typing-cursor';
            element.appendChild(cursor);
            
            // Add glitch effect after typing is complete
            setTimeout(() => {
                element.classList.add('cyberpunk-glitch');
                element.setAttribute('data-text', text);
            }, 500);
        }
    }
    
    typeWriter();
}

// Cursor trail effect
function initCursorTrails() {
    const body = document.querySelector('body');
    const trailCount = 10;
    const trails = [];
    
    // Create trail elements
    for (let i = 0; i < trailCount; i++) {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.opacity = (1 - (i * 0.1)).toString();
        trail.style.width = `${10 - i}px`;
        trail.style.height = `${10 - i}px`;
        body.appendChild(trail);
        trails.push({
            element: trail,
            x: 0,
            y: 0
        });
    }
    
    // Update trail positions
    document.addEventListener('mousemove', function(e) {
        updateTrailPosition(e.clientX, e.clientY);
    });
    
    function updateTrailPosition(x, y) {
        // Update the first trail to cursor position
        if (trails.length > 0) {
            trails[0].x = x;
            trails[0].y = y;
            trails[0].element.style.left = `${x}px`;
            trails[0].element.style.top = `${y}px`;
        }
        
        // Update subsequent trails to follow the previous one with a delay
        for (let i = 1; i < trails.length; i++) {
            const dx = trails[i-1].x - trails[i].x;
            const dy = trails[i-1].y - trails[i].y;
            
            trails[i].x += dx * 0.5;
            trails[i].y += dy * 0.5;
            
            trails[i].element.style.left = `${trails[i].x}px`;
            trails[i].element.style.top = `${trails[i].y}px`;
        }
        
        requestAnimationFrame(() => {
            updateTrailPosition(trails[0].x, trails[0].y);
        });
    }
}

// Style form inputs with cyberpunk effects
function initCyberpunkForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input:not([type="submit"]), textarea');
        
        inputs.forEach(input => {
            // Add focus effects
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                if (!this.value) {
                    this.parentElement.classList.remove('focused');
                }
            });
            
            // Automatically add the focused class if the input has a value
            if (input.value) {
                input.parentElement.classList.add('focused');
            }
        });
    });
}