// ===== Anniversary Invitation Website =====
// Uses localStorage to persist RSVPs (no server needed for GitHub Pages)

(function () {
  'use strict';

  // --- Storage Keys ---
  const STORAGE_KEY = 'anniversary_rsvps';

  // --- Load existing RSVPs from localStorage ---
  function loadRSVPs() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveRSVP(rsvp) {
    const rsvps = loadRSVPs();
    rsvps.push(rsvp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rsvps));
  }

  // --- Navigation show/hide on scroll ---
  const nav = document.getElementById('nav');
  let lastScrollY = 0;

  function handleNavScroll() {
    const currentScrollY = window.scrollY;
    if (currentScrollY > 400) {
      nav.classList.add('visible');
    } else {
      nav.classList.remove('visible');
    }
    lastScrollY = currentScrollY;

    // Update active nav link
    const sections = ['home', 'details', 'story', 'menu', 'rsvp', 'messages'];
    let current = 'home';
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 150) {
        current = id;
      }
    }
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });

  // --- Timeline animation on scroll ---
  function animateTimeline() {
    const items = document.querySelectorAll('.timeline-item');
    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        item.classList.add('visible');
      }
    });
  }

  window.addEventListener('scroll', animateTimeline, { passive: true });
  // Run once on load
  animateTimeline();

  // --- RSVP Form Logic ---
  const form = document.getElementById('rsvp-form');
  const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
  const attendingFields = document.getElementById('attending-fields');
  const guestCountSelect = document.getElementById('guest-count');
  const mealSelectionsDiv = document.getElementById('meal-selections');
  const submitBtn = document.getElementById('submit-btn');
  const rsvpSuccess = document.getElementById('rsvp-success');

  const courses = {
    appetizer: {
      label: 'Appetizer',
      options: [
        { value: 'salad', label: 'Stock Salad — Radish, apple, Parmigiano, asparagus, arugula, frisée' },
        { value: 'octopus', label: 'Skewered Octopus — Corn, tomato, herbs salad & paprika' },
      ],
    },
    main: {
      label: 'Main Course',
      options: [
        { value: 'striploin', label: 'Striploin — 8oz prime striploin, potato pavé, swiss chard, jus' },
        { value: 'branzino', label: 'Branzino Fillet — 1½ fillet, eggplant caponata (green olives, celery, onions, tomatoes, eggplants, basil, mint)' },
      ],
    },
  };

  // Show/hide attending fields
  attendanceRadios.forEach(radio => {
    radio.addEventListener('change', function () {
      if (this.value === 'yes') {
        attendingFields.classList.remove('hidden');
        generateMealSelections(parseInt(guestCountSelect.value));
      } else {
        attendingFields.classList.add('hidden');
      }
    });
  });

  // Update meal selections when guest count changes
  guestCountSelect.addEventListener('change', function () {
    generateMealSelections(parseInt(this.value));
  });

  function generateMealSelections(count) {
    mealSelectionsDiv.innerHTML = '';
    for (let i = 1; i <= count; i++) {
      const guestDiv = document.createElement('div');
      guestDiv.className = 'meal-guest';

      const guestLabel = document.createElement('div');
      guestLabel.className = 'meal-guest-label';
      guestLabel.textContent = count === 1 ? 'Meal Selection' : 'Guest ' + i + ' — Meal Selection';
      guestDiv.appendChild(guestLabel);

      Object.keys(courses).forEach(courseKey => {
        const course = courses[courseKey];

        const courseLabel = document.createElement('div');
        courseLabel.className = 'meal-course-label';
        courseLabel.textContent = course.label;
        guestDiv.appendChild(courseLabel);

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'meal-options';

        course.options.forEach(option => {
          const mealLabel = document.createElement('label');
          mealLabel.className = 'meal-option';

          const input = document.createElement('input');
          input.type = 'radio';
          input.name = courseKey + '_guest_' + i;
          input.value = option.value;
          input.required = true;

          const customRadio = document.createElement('span');
          customRadio.className = 'radio-custom';

          const text = document.createTextNode(option.label);

          mealLabel.appendChild(input);
          mealLabel.appendChild(customRadio);
          mealLabel.appendChild(text);
          optionsDiv.appendChild(mealLabel);
        });

        guestDiv.appendChild(optionsDiv);
      });

      mealSelectionsDiv.appendChild(guestDiv);
    }
  }

  // Initialize with 1 meal selection
  generateMealSelections(1);

  // --- Form Submission ---
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const name = formData.get('name').trim();
    const email = formData.get('email').trim();
    const attendance = formData.get('attendance');
    const message = formData.get('message').trim();

    if (!name || !email || !attendance) return;

    const rsvp = {
      id: Date.now(),
      name: name,
      email: email,
      attendance: attendance,
      message: message,
      timestamp: new Date().toISOString(),
    };

    if (attendance === 'yes') {
      const guestCount = parseInt(formData.get('guestCount'));
      rsvp.guestCount = guestCount;
      rsvp.dietary = formData.get('dietary').trim();
      rsvp.meals = [];

      for (let i = 1; i <= guestCount; i++) {
        const appetizer = formData.get('appetizer_guest_' + i);
        const main = formData.get('main_guest_' + i);
        if (!appetizer || !main) {
          alert('Please select an appetizer and main course for each guest.');
          return;
        }
        rsvp.meals.push({ appetizer: appetizer, main: main });
      }
    }

    // Simulate brief sending delay
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').classList.add('hidden');
    submitBtn.querySelector('.btn-loading').classList.remove('hidden');

    setTimeout(function () {
      saveRSVP(rsvp);

      // Show success, hide form
      form.classList.add('hidden');
      form.style.display = 'none';
      rsvpSuccess.classList.remove('hidden');

      // Add message to wall if provided
      if (message) {
        addMessageToWall(name, message);
      }
    }, 800);
  });

  // --- Messages Wall ---
  const messagesGrid = document.getElementById('messages-grid');
  const noMessages = document.getElementById('no-messages');

  function addMessageToWall(author, text) {
    noMessages.classList.add('hidden');

    const card = document.createElement('div');
    card.className = 'message-card';

    const authorEl = document.createElement('div');
    authorEl.className = 'message-author';
    authorEl.textContent = author;

    const textEl = document.createElement('div');
    textEl.className = 'message-text';
    textEl.textContent = '"' + text + '"';

    card.appendChild(authorEl);
    card.appendChild(textEl);
    messagesGrid.insertBefore(card, messagesGrid.firstChild);
  }

  // Load existing messages on page load
  function loadMessages() {
    const rsvps = loadRSVPs();
    const withMessages = rsvps.filter(r => r.message);

    if (withMessages.length > 0) {
      noMessages.classList.add('hidden');
      withMessages.reverse().forEach(r => {
        const card = document.createElement('div');
        card.className = 'message-card';

        const authorEl = document.createElement('div');
        authorEl.className = 'message-author';
        authorEl.textContent = r.name;

        const textEl = document.createElement('div');
        textEl.className = 'message-text';
        textEl.textContent = '"' + r.message + '"';

        card.appendChild(authorEl);
        card.appendChild(textEl);
        messagesGrid.appendChild(card);
      });
    }
  }

  loadMessages();

  // --- Smooth scroll for nav links ---
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
