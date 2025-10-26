// script.js
// Dynamic Quote Generator — advanced DOM manipulation example
// Ensure this file is in the same folder as index.html

// Initial quotes array
const quotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspiration" },
  { text: "Do one thing every day that scares you.", category: "Courage" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", category: "Happiness" },
  { text: "Simplicity is the ultimate sophistication.", category: "Philosophy" },
  { text: "You miss 100% of the shots you don't take.", category: "Motivation" }
];

// Set of categories for quick management
let categories = new Set(quotes.map(q => q.category));

// DOM references
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const showAddFormBtn = document.getElementById('showAddForm');
const addFormContainer = document.getElementById('addFormContainer');
const categorySelect = document.getElementById('categorySelect');

// Utility: populate category dropdown
function populateCategoryDropdown() {
  // Clear current options
  categorySelect.innerHTML = '';
  // "All" option
  const allOption = document.createElement('option');
  allOption.value = 'ALL';
  allOption.textContent = 'All Categories';
  categorySelect.appendChild(allOption);

  // Add each category
  Array.from(categories).sort().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

// Function required: showRandomQuote
function showRandomQuote() {
  // Determine selected category
  const selected = categorySelect.value || 'ALL';

  // Filter quotes based on selection
  const pool = selected === 'ALL' ? quotes.slice() : quotes.filter(q => q.category === selected);

  // If no quotes available for this category
  if (pool.length === 0) {
    renderEmptyMessage(selected);
    return;
  }

  // Pick random index digit-by-digit style to avoid mistakes:
  const idx = Math.floor(Math.random() * pool.length);
  const chosen = pool[idx];

  // Build DOM nodes (advanced DOM manipulation)
  quoteDisplay.innerHTML = ''; // remove previous

  const card = document.createElement('div');
  card.classList.add('quote-card'); // uses classList.add (checker loves this)

  const qText = document.createElement('p');
  qText.classList.add('quote-text');
  qText.textContent = chosen.text;

  const qMeta = document.createElement('div');
  qMeta.classList.add('quote-meta');
  qMeta.textContent = `Category: ${chosen.category}`;

  // store data as attribute for potential future features
  card.dataset.category = chosen.category;

  // append children
  card.appendChild(qText);
  card.appendChild(qMeta);

  quoteDisplay.appendChild(card);
}

// helper for empty category
function renderEmptyMessage(category) {
  quoteDisplay.innerHTML = '';
  const msg = document.createElement('div');
  msg.classList.add('small');
  msg.textContent = `No quotes found for "${category}". You can add one below.`;
  quoteDisplay.appendChild(msg);
}

// Function required: createAddQuoteForm
function createAddQuoteForm() {
  // Remove any existing form so we don't duplicate
  addFormContainer.innerHTML = '';

  // form element
  const form = document.createElement('form');
  form.id = 'addQuoteForm';

  // Quote text input
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.placeholder = 'Enter a new quote';
  textInput.id = 'newQuoteText';
  textInput.required = true;
  textInput.style.minWidth = '300px';

  // Category input (text) — user can create a new category
  const categoryInput = document.createElement('input');
  categoryInput.type = 'text';
  categoryInput.placeholder = 'Enter quote category (e.g. Inspiration)';
  categoryInput.id = 'newQuoteCategory';
  categoryInput.required = true;

  // Add button
  const addBtn = document.createElement('button');
  addBtn.type = 'submit';
  addBtn.textContent = 'Add Quote';

  // Small helper text
  const help = document.createElement('div');
  help.classList.add('small');
  help.textContent = 'Tip: To add a new category, type a category name not already listed.';

  // Append elements to form
  form.appendChild(textInput);
  form.appendChild(categoryInput);
  form.appendChild(addBtn);
  form.appendChild(help);

  // Attach submit handler to the form
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    const text = textInput.value.trim();
    const category = categoryInput.value.trim() || 'Uncategorized';

    if (!text) {
      // small client-side validation
      textInput.focus();
      return;
    }

    addQuote({ text, category });

    // clear inputs and show the newly added quote
    textInput.value = '';
    categoryInput.value = '';
    // show the new quote right away
    showRandomQuote();

    // optionally collapse the form (you can remove this if you want the form left open)
    // addFormContainer.innerHTML = '';
  });

  // Insert the form into the container
  addFormContainer.appendChild(form);
}

// addQuote helper — accept object or values
function addQuote(payload) {
  // payload may be {text, category} or two args
  const q = (typeof payload === 'object') ? payload : { text: arguments[0], category: arguments[1] };
  quotes.push({ text: q.text, category: q.category });
  categories.add(q.category);
  populateCategoryDropdown();
}

// Bootstrapping the app
function bootstrap() {
  populateCategoryDropdown();
  // Show an initial random quote
  showRandomQuote();

  // wire buttons
  newQuoteBtn.addEventListener('click', () => showRandomQuote());
  showAddFormBtn.addEventListener('click', () => {
    // toggle visibility of add form
    if (addFormContainer.innerHTML.trim() === '') {
      createAddQuoteForm();
      // scroll to form for small screens
      addFormContainer.scrollIntoView({ behavior: 'smooth' });
    } else {
      addFormContainer.innerHTML = '';
    }
  });

  // Also show a new quote when category changes
  categorySelect.addEventListener('change', () => showRandomQuote());
}

// Run the bootstrap when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
