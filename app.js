// ===== Anniversary Invitation Website =====
// RSVPs are saved to Google Sheets + localStorage

(function () {
  'use strict';

  // --- Google Apps Script URL ---
  // REPLACE THIS with your deployed Google Apps Script web app URL
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwENMguFr0bXGzqh3GfxXS7eAe42dYtBlQpkbq39Nl5qEAy-WBJ0pudRshu61O5xJNZUg/exec';

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

  function saveRSVPLocal(rsvp) {
    const rsvps = loadRSVPs();
    rsvps.push(rsvp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rsvps));
  }

  function saveRSVPToSheet(rsvp) {
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_URL_HERE') return;
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rsvp),
    }).catch(function () {
      // Silently fail — localStorage backup is already saved
    });
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
    const sections = ['home', 'details', 'story', 'rsvp', 'messages'];
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
  const submitBtn = document.getElementById('submit-btn');
  const rsvpSuccess = document.getElementById('rsvp-success');

  // Show/hide attending fields
  attendanceRadios.forEach(radio => {
    radio.addEventListener('change', function () {
      if (this.value === 'yes') {
        attendingFields.classList.remove('hidden');
      } else {
        attendingFields.classList.add('hidden');
      }
    });
  });

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
    }

    // Simulate brief sending delay
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').classList.add('hidden');
    submitBtn.querySelector('.btn-loading').classList.remove('hidden');

    setTimeout(function () {
      // Save locally
      saveRSVPLocal(rsvp);

      // Format and send to Google Sheet
      var sheetData = {
        name: rsvp.name,
        email: rsvp.email,
        attendance: rsvp.attendance === 'yes' ? 'Joyfully Accepts' : 'Respectfully Declines',
        guestCount: rsvp.guestCount || '',
        message: rsvp.message,
      };
      saveRSVPToSheet(sheetData);

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

  // Load existing messages on page load from Google Sheets
  function loadMessages() {
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_URL_HERE') return;
    fetch(GOOGLE_SCRIPT_URL)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.result === 'success' && data.messages && data.messages.length > 0) {
          noMessages.classList.add('hidden');
          // Reverse so newest submissions (bottom of sheet) appear first
          data.messages.slice().reverse().forEach(function (r) {
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
      })
      .catch(function () {
        // Silently fail if the sheet is unreachable
      });
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
