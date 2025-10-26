let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Inspiration" }
];

const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');
const exportBtn = document.getElementById('exportQuotes');
const syncBtn = document.getElementById('syncQuotes');
const syncStatus = document.getElementById('syncStatus');

// Show random quote
function showRandomQuote() {
  let filteredQuotes = quotes;
  const selectedCategory = categoryFilter.value;

  if (selectedCategory !== 'all') {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];
  quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.category}`;

  sessionStorage.setItem('lastQuote', JSON.stringify(randomQuote));
}

// Add new quote
function addQuote() {
  const text = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
  alert("Quote added successfully!");
}

// Save quotes locally
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Populate categories dynamically
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const lastSelected = localStorage.getItem('selectedCategory');
  if (lastSelected) {
    categoryFilter.value = lastSelected;
  }
}

// Filter quotes
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem('selectedCategory', selectedCategory);
  showRandomQuote();
}

// Export quotes
function exportQuotes() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import quotes
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format.");
      }
    } catch (error) {
      alert("Error importing file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Simulated Server Sync (using JSONPlaceholder)
async function syncWithServer() {
  syncStatus.textContent = "Syncing with server...";
  syncStatus.style.color = "orange";

  try {
    // Fetch “server” data (simulation)
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=3");
    const serverData = await response.json();

    // Simulate quotes from server
    const serverQuotes = serverData.map(item => ({
      text: item.title,
      category: "Server"
    }));

    // Merge with local, resolve conflicts (server wins)
    quotes = mergeQuotes(serverQuotes, quotes);
    saveQuotes();
    populateCategories();

    syncStatus.textContent = "Sync completed successfully!";
    syncStatus.style.color = "green";
  } catch (error) {
    syncStatus.textContent = "Sync failed. Please try again.";
    syncStatus.style.color = "red";
  }
}

// Conflict resolution (server data overrides duplicates)
function mergeQuotes(serverQuotes, localQuotes) {
  const combined = [...localQuotes];
  serverQuotes.forEach(serverQuote => {
    const exists = combined.some(local => local.text === serverQuote.text);
    if (!exists) {
      combined.push(serverQuote);
    }
  });
  return combined;
}

// Periodic auto-sync every 60 seconds
setInterval(syncWithServer, 60000);

// Event Listeners
newQuoteBtn.addEventListener('click', showRandomQuote);
exportBtn.addEventListener('click', exportQuotes);
syncBtn.addEventListener('click', syncWithServer);

// Initialize
populateCategories();
filterQuotes();
