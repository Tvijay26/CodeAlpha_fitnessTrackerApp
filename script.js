// Using ES modules, modern JS with classes & clean structure
const STORAGE_KEY = 'advancedFitnessActivities';

class FitnessTracker {
  constructor() {
    this.data = [];
    this.sortOrder = 'desc'; // default sorting newest first
    this.entriesListEl = document.getElementById('entries-list');
    this.dashboardEl = document.getElementById('dashboard');
    this.formEl = document.getElementById('fitness-form');
    this.sortSelectEl = document.getElementById('sort-order');

    this.modalEl = document.getElementById('modal');
    this.modalConfirmBtn = document.getElementById('modal-confirm');
    this.modalCancelBtn = document.getElementById('modal-cancel');

    this.entryToDeleteIndex = null;

    this.init();
  }

  init() {
    this.loadData();
    this.initDateInput();
    this.renderDashboard();
    this.renderEntries();
    this.attachEventListeners();
  }

  loadData() {
    const json = localStorage.getItem(STORAGE_KEY);
    this.data = json ? JSON.parse(json) : [];
  }

  saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  initDateInput() {
    const dateInput = this.formEl.date;
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today;
  }

  attachEventListeners() {
    this.formEl.addEventListener('submit', e => {
      e.preventDefault();
      this.addEntry();
    });

    this.sortSelectEl.addEventListener('change', e => {
      this.sortOrder = e.target.value;
      this.renderEntries();
    });

    // Modal buttons
    this.modalConfirmBtn.addEventListener('click', () => {
      if (this.entryToDeleteIndex !== null) {
        this.deleteEntry(this.entryToDeleteIndex);
        this.hideModal();
      }
    });

    this.modalCancelBtn.addEventListener('click', () => {
      this.hideModal();
    });

    // Modal close on outside click
    this.modalEl.addEventListener('click', e => {
      if (e.target === this.modalEl) {
        this.hideModal();
      }
    });

    this.addDashboardHoverTouchEffects();
  }

  addEntry() {
    const newEntry = {
      date: this.formEl.date.value,
      steps: this.parseNumberInput(this.formEl.steps.value),
      workoutDuration: this.parseNumberInput(this.formEl.workoutDuration.value),
      calories: this.parseNumberInput(this.formEl.calories.value),
      distance: this.parseNumberInput(this.formEl.distance.value),
      heartRate: this.parseNumberInput(this.formEl.heartRate.value),
    };

    if (!newEntry.date) {
      alert('Please select a valid date.');
      return;
    }

    if (this.data.some(e => e.date === newEntry.date)) {
      if (!confirm('An entry for this date exists. Add anyway?')) {
        return;
      }
    }

    this.data.push(newEntry);
    this.saveData();
    this.formEl.reset();
    this.initDateInput();

    this.renderDashboard();
    this.renderEntries();
  }

  parseNumberInput(value) {
    const n = Number(value);
    return isNaN(n) || n < 0 ? 0 : n;
  }

  renderDashboard() {
    if (this.data.length === 0) {
      this.dashboardEl.innerHTML = '<p class="no-entries-msg">Add some activities to see dashboard stats.</p>';
      return;
    }

    // Calculate totals and averages
    const totals = {
      steps: 0,
      workoutDuration: 0,
      calories: 0,
      distance: 0,
      heartRates: [],
    };

    this.data.forEach(e => {
      totals.steps += e.steps || 0;
      totals.workoutDuration += e.workoutDuration || 0;
      totals.calories += e.calories || 0;
      totals.distance += e.distance || 0;
      if (e.heartRate > 0) totals.heartRates.push(e.heartRate);
    });

    const avgHeartRate =
      totals.heartRates.length > 0
        ? Math.round(totals.heartRates.reduce((a, b) => a + b, 0) / totals.heartRates.length)
        : '--';

    // Prepare cards data
    const cards = [
      { title: 'Steps', value: totals.steps, key: 'steps' },
      { title: 'Workout Duration (min)', value: totals.workoutDuration, key: 'workoutDuration' },
      { title: 'Calories Burned', value: totals.calories, key: 'calories' },
      { title: 'Distance (km)', value: totals.distance.toFixed(2), key: 'distance' },
      { title: 'Avg Heart Rate (bpm)', value: avgHeartRate, key: 'heartRate' },
    ];

    this.dashboardEl.innerHTML = '';

    cards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'activity-card';
      cardEl.dataset.key = card.key;
      cardEl.setAttribute('role', 'listitem');
      cardEl.setAttribute('tabindex', '0');

      cardEl.innerHTML = `
        <h3>${card.title}</h3>
        <p>${card.value}</p>
      `;

      this.dashboardEl.appendChild(cardEl);
    });
  }

  renderEntries() {
    if (this.data.length === 0) {
      this.entriesListEl.innerHTML = '<p class="no-entries-msg">No activities logged yet.</p>';
      return;
    }

    // Sort entries by date
    const sortedData = [...this.data].sort((a, b) => {
      return this.sortOrder === 'asc'
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    });

    this.entriesListEl.innerHTML = '';

    sortedData.forEach((entry, idx) => {
      const item = document.createElement('div');
      item.className = 'entry-item';
      item.tabIndex = 0;
      item.setAttribute('role', 'listitem');
      item.dataset.index = idx;

      // Format date to more readable form
      const dateStr = new Date(entry.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      item.innerHTML = `
        <div class="entry-info" title="Date: ${dateStr}
Steps: ${entry.steps}
Workout: ${entry.workoutDuration} min
Calories: ${entry.calories}
Distance: ${entry.distance} km
Heart Rate: ${entry.heartRate} bpm">
          <strong>${dateStr}</strong> — Steps: ${entry.steps}, Workout: ${entry.workoutDuration} min, Calories: ${entry.calories}, Distance: ${entry.distance.toFixed(
        2
      )} km, Heart Rate: ${entry.heartRate} bpm
        </div>
        <button class="delete-btn" aria-label="Delete entry for ${dateStr}">&times;</button>
      `;

      const deleteBtn = item.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => {
        this.entryToDeleteIndex = this.data.indexOf(entry);
        this.showModal();
      });

      this.entriesListEl.appendChild(item);
    });
  }

  deleteEntry(index) {
    if (index >= 0 && index < this.data.length) {
      this.data.splice(index, 1);
      this.saveData();
      this.renderDashboard();
      this.renderEntries();
    }
  }

  showModal() {
    this.modalEl.classList.remove('hidden');
    this.modalConfirmBtn.focus();
  }

  hideModal() {
    this.modalEl.classList.add('hidden');
    this.entryToDeleteIndex = null;
    this.formEl.querySelector('button[type="submit"]').focus();
  }

  addDashboardHoverTouchEffects() {
    const dashboardCards = document.querySelectorAll('.activity-card');

    // Random pastel colors
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#556270',
      '#C7F464',
      '#FFA07A',
      '#9D94FF',
      '#FFD93D',
      '#6BCB77',
      '#FF9F1C',
      '#2EC4B6',
    ];

    function randomColor() {
      return colors[Math.floor(Math.random() * colors.length)];
    }

    dashboardCards.forEach(card => {
      // Store original color and background
      card.style.transition = 'background-color 1s ease, color 1s ease';

      card.addEventListener('mouseenter', () => {
        const bgColor = randomColor();
        card.style.backgroundColor = bgColor;
        card.style.color = '#fff';
        card.style.borderColor = '#fff';
        card.classList.add('active-color');
      });

      card.addEventListener('mouseleave', () => {
        card.style.backgroundColor = '#f4f7fa';
        card.style.color = '#22303c';
        card.style.borderColor = 'transparent';
        card.classList.remove('active-color');
      });

      // For touch devices
      card.addEventListener('touchstart', e => {
        e.preventDefault();
        const bgColor = randomColor();
        card.style.backgroundColor = bgColor;
        card.style.color = '#fff';
        card.style.borderColor = '#fff';
        card.classList.add('active-color');
      });

      card.addEventListener('touchend', e => {
        e.preventDefault();
        setTimeout(() => {
          card.style.backgroundColor = '#f4f7fa';
          card.style.color = '#22303c';
          card.style.borderColor = 'transparent';
          card.classList.remove('active-color');
        }, 700);
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new FitnessTracker();
});
