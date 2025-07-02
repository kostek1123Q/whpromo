// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCa3peMi77oYFn12a2Py1p5wxjG0eu7XkI",
  authDomain: "whpromo-621fb.firebaseapp.com",
  databaseURL: "https://whpromo-621fb-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "whpromo-621fb",
  storageBucket: "whpromo-621fb.appspot.com",
  messagingSenderId: "580137422916",
  appId: "1:580137422916:web:7596e00ee550074694ec11",
  measurementId: "G-PS9SEK1HHP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const adminToggle = document.getElementById('adminToggle');
const addForm = document.getElementById('addForm');
const nameInput = document.getElementById('name');
const linkInput = document.getElementById('link');
const typeSelect = document.getElementById('type');
const groupList = document.getElementById('groupList');
const channelList = document.getElementById('channelList');
const rankingList = document.getElementById('rankingList');
const searchInput = document.getElementById('searchInput');
const sortButtons = document.querySelectorAll('.sort-buttons button');

let isAdmin = false;
let allItems = {}; // all groups + channels loaded
let votesByIP = {}; // simple local storage IP-based vote control simulation

adminToggle.addEventListener('click', () => {
  isAdmin = !isAdmin;
  adminToggle.textContent = isAdmin ? 'Tryb Admina (ON)' : 'Tryb Admina (OFF)';
  renderLists();
});

addForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const link = linkInput.value.trim();
  const type = typeSelect.value;

  if (!name || !link || !type) return alert('Wypełnij wszystkie pola');

  // Prepare new item data
  const newItem = {
    name,
    link,
    type,
    createdAt: Date.now(),
    rating: 0,
    votes: 0
  };

  // Push to firebase
  db.ref('items').push(newItem)
    .then(() => {
      addForm.reset();
    })
    .catch(err => alert('Błąd przy dodawaniu: ' + err.message));
});

// Load all items from firebase and listen for changes
db.ref('items').on('value', snapshot => {
  allItems = snapshot.val() || {};
  renderLists();
});

searchInput.addEventListener('input', renderLists);
sortButtons.forEach(btn => btn.addEventListener('click', () => {
  currentSort = btn.getAttribute('data-sort');
  renderLists();
}));

let currentSort = 'new';

function renderLists() {
  const searchTerm = searchInput.value.toLowerCase();

  // Filter and sort items
  let filteredItems = Object.entries(allItems).filter(([id, item]) => {
    if (!item.name) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm)) return false;
    return true;
  });

  if (currentSort === 'new') {
    filteredItems.sort((a, b) => b[1].createdAt - a[1].createdAt);
  } else if (currentSort === 'best') {
    filteredItems.sort((a, b) => {
      const avgA = a[1].votes > 0 ? a[1].rating / a[1].votes : 0;
      const avgB = b[1].votes > 0 ? b[1].rating / b[1].votes : 0;
      return avgB - avgA;
    });
  }

  // Clear lists
  groupList.innerHTML = '';
  channelList.innerHTML = '';
  rankingList.innerHTML = '';

  // Top 5 for ranking
  const rankingItems = filteredItems.slice(0, 5);

  rankingItems.forEach(([id, item]) => {
    const avgRating = item.votes > 0 ? (item.rating / item.votes).toFixed(2) : "0.00";
    const li = document.createElement('li');
    li.innerHTML = `<a href="${item.link}" target="_blank" rel="noopener">${item.name}</a> <span class="rating">${avgRating}⭐</span>`;
    rankingList.appendChild(li);
  });

  // Render groups and channels separately
  filteredItems.forEach(([id, item]) => {
    const avgRating = item.votes > 0 ? (item.rating / item.votes).toFixed(2) : "0.00";

    const li = document.createElement('li');

    li.innerHTML = `
      <a href="${item.link}" target="_blank" rel="noopener">${item.name}</a>
      <div class="rating">
        <button title="Oceń +1" data-id="${id}" data-value="1">👍</button>
        <button title="Oceń -1" data-id="${id}" data-value="-1">👎</button>
        <span>${avgRating}⭐ (${item.votes || 0})</span>
        ${isAdmin ? `<button class="delete-btn" data-id="${id}">Usuń</button>` : ''}
      </div>
    `;

    // Append to proper list
    if (item.type === "Grupa") {
      groupList.appendChild(li);
    } else if (item.type === "Kanał") {
      channelList.appendChild(li);
    }
  });

  // Attach event listeners for rating buttons
  document.querySelectorAll('.rating button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const val = parseInt(btn.getAttribute('data-value'));

      if (hasVoted(id)) {
        alert('Już oceniłeś tę pozycję');
        return;
      }
      vote(id, val);
    });
  });

  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Na pewno chcesz usunąć tę pozycję?')) {
        db.ref('items/' + id).remove();
      }
    });
  });
}

function hasVoted(id) {
  const votes = JSON.parse(localStorage.getItem('votes') || '{}');
  return votes[id];
}

function vote(id, val) {
  // Mark as voted
  const votes = JSON.parse(localStorage.getItem('votes') || '{}');
  votes[id] = true;
  localStorage.setItem('votes', JSON.stringify(votes));

  // Update in Firebase
  const itemRef = db.ref('items/' + id);
  itemRef.transaction(item => {
    if (item) {
      item.rating = (item.rating || 0) + val;
      item.votes = (item.votes || 0) + 1;
    }
    return item;
  });
}
