// script.js — Persistence + import/export for Dynamic Quote Generator
// Place in dom-manipulation/ alongside index.html

// ---- Constants for storage keys ----
const LS_KEY = 'dqg_quotes_v1';          // localStorage key for quotes
const SS_LAST_VIEWED = 'dqg_last_viewed' // sessionStorage key for last viewed quote index and category

// ---- Initial default quotes ----
const defaultQuotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspiration" },
  { text: "Do one thing every day that scares you.", category: "Courage" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", category: "Happiness" },
  { text: "Simplicity is the ultimate sophistication.", category: "Philosophy" },
  { text: "You miss 100% of the shots you don't take.", category: "Motivation" }
];

// ---- App state ----
let quotes = [];               // will be loaded from localStorage or default
let categories = new Set();

// ---- DOM refs ----
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const showAddFormBtn = document.getElementById('showAddForm');
const addFormContainer = document.getElementById('addFormContainer');
const categorySelect = document.getElementById('categorySelect');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importFileInput = document.getElementById('importFile');
const clearStorageBtn = document.getElementById('clearStorageBtn');

// ---- Storage helpers ----
function saveQuotesToLocalStorage() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error('Failed to save quotes to localStorage', err);
  }
}

function loadQuotesFromLocalStorage() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) {
    quotes = defaultQuotes.slice();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    // Ensure parsed is an array of objects with text & category
    if (!Array.isArray(parsed)) throw new Error('Saved data not an array');
    const valid = parsed.every(q => q && typeof q.text === 'string');
    if (!valid) throw new Error('Saved data malformed');
    quotes = parsed;
  } catch (err) {
    console.warn('Could not parse saved quotes — reverting to defaults.', err);
    quotes = defaultQuotes.slice();
  }
}

// ---- Category dropdown ----
function rebuildCategories() {
  categories = new Set(quotes.map(q => q.category || 'Uncategorized'));
}

function populateCategoryDropdown() {
  categorySelect.innerHTML = '';
  const allOption = document.createElement('option');
  allOption.value = 'ALL';
  allOption.textContent = 'All Categories';
  categorySelect.appendChild(allOption);
  Array.from(categories).sort().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

// ---- showRandomQuote (required) ----
function showRandomQuote() {
  const selected = categorySelect.value || 'ALL';
  const pool = selected === 'ALL' ? quotes.slice() : quotes.filter(q => q.category === selected);
  if (pool.length === 0) {
    renderEmptyMessage(selected);
    // Clear last viewed if none
    sessionStorage.removeItem(SS_LAST_VIEWED);
    return;
  }

  // Choose random index digit-by-digit reliably
  const idx = Math.floor(Math.random() * pool.length);
  const chosen = pool[idx];

  quoteDisplay.innerHTML = '';
  const card = document.createElement('div');
  card.classList.add('quote-card');
  card.dataset.category = chosen.category;

  const qText = document.createElement('p');
  qText.classList.add('quote-text');
  qText.textContent = chosen.text;

  const qMeta = document.createElement('div');
  qMeta.classList.add('quote-meta');
  qMeta.textContent = `Category: ${chosen.category}`;

  // Edit/Delete controls (small inline) — optional but useful
  const controls = document.createElement('div');
  controls.classList.add('small');
  controls.style.marginTop = '8px';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => openEditModal(chosen));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.textContent = 'Delete';
  deleteBtn.style.marginLeft = '8px';
  deleteBtn.addEventListener('click', () => {
    if (!confirm('Delete this quote?')) return;
    deleteQuote(chosen);
  });

  controls.appendChild(editBtn);
  controls.appendChild(deleteBtn);

  card.appendChild(qText);
  card.appendChild(qMeta);
  card.appendChild(controls);

  quoteDisplay.appendChild(card);

  // Store last viewed in session storage (store actual text and category for robust recall)
  try {
    sessionStorage.setItem(SS_LAST_VIEWED, JSON.stringify({ text: chosen.text, category: chosen.category }));
  } catch (err) {
    console.warn('Failed to set sessionStorage', err);
  }
}

function renderEmptyMessage(category) {
  quoteDisplay.innerHTML = '';
  const msg = document.createElement('div');
  msg.classList.add('small');
  msg.textContent = `No quotes found for "${category}". Add one below or choose a different category.`;
  quoteDisplay.appendChild(msg);
}

// ---- Add / Edit / Delete ----
function createAddQuoteForm() {
  addFormContainer.innerHTML = '';

  const form = document.createElement('form');
  form.id = 'addQuoteForm';

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.placeholder = 'Enter a new quote';
  textInput.id = 'newQuoteText';
  textInput.required = true;
  textInput.style.minWidth = '300px';

  const categoryInput = document.createElement('input');
  categoryInput.type = 'text';
  categoryInput.placeholder = 'Enter quote category (e.g. Inspiration)';
  categoryInput.id = 'newQuoteCategory';
  categoryInput.required = true;

  const addBtn = document.createElement('button');
  addBtn.type = 'submit';
  addBtn.textContent = 'Add Quote';

  const help = document.createElement('div');
  help.classList.add('small');
  help.textContent = 'Tip: To add a new category, type a category name not already listed.';

  form.appendChild(textInput);
  form.appendChild(categoryInput);
  form.appendChild(addBtn);
  form.appendChild(help);

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    const text = textInput.value.trim();
    const category = categoryInput.value.trim() || 'Uncategorized';
    if (!text) { textInput.focus(); return; }
    addQuote({ text, category });
    textInput.value = '';
    categoryInput.value = '';
    showRandomQuote();
  });

  addFormContainer.appendChild(form);
}

// addQuote saves to state + localStorage
function addQuote(q) {
  quotes.push({ text: q.text, category: q.category });
  rebuildCategories();
  populateCategoryDropdown();
  saveQuotesToLocalStorage();
}

// deleteQuote finds by exact text+category and removes first match
function deleteQuote(target) {
  const index = quotes.findIndex(q => q.text === target.text && q.category === target.category);
  if (index === -1) return;
  quotes.splice(index, 1);
  rebuildCategories();
  populateCategoryDropdown();
  saveQuotesToLocalStorage();
  // show another quote or empty message
  showRandomQuote();
}

// openEditModal -> simple prompt-based editing for this exercise
function openEditModal(item) {
  const newText = prompt('Edit quote text:', item.text);
  if (newText === null) return; // cancelled
  const newCategory = prompt('Edit category:', item.category) || 'Uncategorized';
  // find and replace first matching item
  const idx = quotes.findIndex(q => q.text === item.text && q.category === item.category);
  if (idx === -1) return alert('Original quote not found.');
  quotes[idx].text = newText.trim() || quotes[idx].text;
  quotes[idx].category = newCategory.trim() || quotes[idx].category;
  rebuildCategories();
  populateCategoryDropdown();
  saveQuotesToLocalStorage();
  showRandomQuote();
}

// ---- Import / Export JSON ----
function exportQuotesAsJson() {
  try {
    const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `dqg-quotes-${now}.json`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export failed', err);
    alert('Failed to export quotes.');
  }
}

function importFromJsonFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!Array.isArray(parsed)) throw new Error('Imported file must be a JSON array of quote objects.');
      // Validate items and sanitize
      const cleaned = [];
      for (const item of parsed) {
        if (!item || typeof item.text !== 'string') continue;
        cleaned.push({ text: item.text.trim(), category: (item.category && String(item.category).trim()) || 'Uncategorized' });
      }
      if (cleaned.length === 0) return alert('No valid quote objects found in the file.');
      // Merge while avoiding duplicates (simple dedupe by text+category)
      const existingSet = new Set(quotes.map(q => `${q.text}|||${q.category}`));
      let added = 0;
      cleaned.forEach(q => {
        const key = `${q.text}|||${q.category}`;
        if (!existingSet.has(key)) {
          quotes.push(q);
          existingSet.add(key);
          added++;
        }
      });
      rebuildCategories();
      populateCategoryDropdown();
      saveQuotesToLocalStorage();
      alert(`Import complete — ${added} new quote(s) added.`);
    } catch (err) {
      console.error('Import failed', err);
      alert('Failed to import JSON. Make sure it is valid and follows the format: [{ "text": "...", "category": "..." }, ...]');
    }
  };
  reader.onerror = function () {
    alert('Failed to read file.');
  };
  reader.readAsText(file);
}

// ---- Clear storage (helper) ----
function clearSavedQuotes() {
  if (!confirm('Clear saved quotes from localStorage and reset to defaults?')) return;
  localStorage.removeItem(LS_KEY);
  loadQuotesFromLocalStorage();
  rebuildCategories();
  populateCategoryDropdown();
  showRandomQuote();
}

// ---- Session restore: last viewed quote ----
function tryRestoreLastViewed() {
  try {
    const raw = sessionStorage.getItem(SS_LAST_VIEWED);
    if (!raw) return false;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj.text !== 'string') return false;
    // Try to find this quote in current quotes; if found, show it
    const found = quotes.find(q => q.text === obj.text && q.category === obj.category);
    if (found) {
      // Set category dropdown to the quote's category so showRandomQuote pool will match if user changes
      categorySelect.value = obj.category || 'ALL';
      // Render that exact quote
      quoteDisplay.innerHTML = '';
      const card = document.createElement('div');
      card.classList.add('quote-card');
      card.dataset.category = found.category;

      const qText = document.createElement('p');
      qText.classList.add('quote-text');
      qText.textContent = found.text;

      const qMeta = document.createElement('div');
      qMeta.classList.add('quote-meta');
      qMeta.textContent = `Category: ${found.category}`;

      card.appendChild(qText);
      card.appendChild(qMeta);
      quoteDisplay.appendChild(card);
      return true;
    }
  } catch (err) {
    console.warn('Failed to restore last viewed', err);
  }
  return false;
}

// ---- Bootstrapping ----
function bootstrap() {
  loadQuotesFromLocalStorage();
  rebuildCategories();
  populateCategoryDropdown();

  // Attempt to restore last viewed quote from session; otherwise show random
  const restored = tryRestoreLastViewed();
  if (!restored) showRandomQuote();

  // Wire up handlers
  newQuoteBtn.addEventListener('click', () => showRandomQuote());
  showAddFormBtn.addEventListener('click', () => {
    if (addFormContainer.innerHTML.trim() === '') {
      createAddQuoteForm();
      addFormContainer.scrollIntoView({ behavior: 'smooth' });
    } else {
      addFormContainer.innerHTML = '';
    }
  });
  categorySelect.addEventListener('change', () => showRandomQuote());
  exportJsonBtn.addEventListener('click', () => exportQuotesAsJson());
  importFileInput.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (file) importFromJsonFile(file);
    // reset input so same file can be selected again if needed
    importFileInput.value = '';
  });
  clearStorageBtn.addEventListener('click', () => clearSavedQuotes());
}

// run when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
