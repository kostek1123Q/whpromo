const addForm = document.getElementById('addForm');
const nameInput = document.getElementById('name');
const linkInput = document.getElementById('link');
const typeSelect = document.getElementById('type');
const groupList = document.getElementById('groupList');
const channelList = document.getElementById('channelList');
const rankingList = document.getElementById('rankingList');
const searchInput = document.getElementById('searchInput');
const sortButtons = document.querySelectorAll('.sort-buttons button');
const adminToggle = document.getElementById('adminToggle');

let isAdmin = false;
let allGroups = {};
let allChannels = {};
let currentSort = 'new';

adminToggle.addEventListener('click', () => {
  isAdmin = !isAdmin;
  adminToggle.textContent = isAdmin ? 'Tryb Użytkownika' : 'Tryb Admina';
  renderLists();
});

addForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const link = linkInput.value.trim();
  const type = typeSelect.value;

  if (!name || !link || !type) return alert('Wypełnij wszystkie pola!');

  // Dodaj nowy element do Firebase
  const newItemRef = database.ref(type).push();
  newItemRef.set({
    name,
    link,
    createdAt: Date.now(),
    rating: 0,
    votes: 0
  });

  addForm.reset();
});

function deleteItem(type, key) {
  if (!isAdmin) return alert('Tylko admin może usuwać!');
  database.ref(`${type}/${key}`).remove();
}

function renderLists() {
  renderList('groups', allGroups, groupList);
  renderList('channels', allChannels, channelList);
  renderRanking();
}

function renderList(type, items, container) {
  container.innerHTML = '';
  if (!items) return;

  let arr = Object.entries(items);

  // Filtruj po wyszukiwarce
  const search = searchInput.value.trim().toLowerCase();
  if (search) {
    arr = arr.filter(([, v]) => v.name.toLowerCase().includes(search));
  }

  // Sortowanie
  if (currentSort === 'new') {
    arr.sort((a, b) => b[1].createdAt - a[1].createdAt);
  } else if (currentSort === 'best') {
    arr.sort((a, b) => {
      const ratingA = a[1].votes ? a[1].rating / a[1].votes : 0;
      const ratingB = b[1].votes ? b[1].rating / b[1].votes : 0;
      return ratingB - ratingA;
    });
  }

  for (const [key, item] of arr) {
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.name}</a>
      <span>⭐ ${item.votes ? (item.rating / item.votes).toFixed(2) : '0'}</span>
      ${isAdmin ? `<button class="delete-btn" data-type="${type}" data-key="${key}">Usuń</button>` : ''}
    `;
    container.appendChild(li);
  }

  // Obsługa usuwania
  if (isAdmin) {
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.getAttribute('data-type');
        const k = btn.getAttribute('data-key');
        if (confirm('Na pewno chcesz usunąć?')) {
          deleteItem(t, k);
        }
      });
    });
  }
}

function renderRanking() {
  rankingList.innerHTML = '';

  const combined = {...allGroups, ...allChannels};
  if (!combined) return;

  const arr = Object.entries(combined);
  arr.sort((a, b) => {
    const ratingA = a[1].votes ? a[1].rating / a[1].votes : 0;
    const ratingB = b[1].votes ? b[1].rating / b[1].votes : 0;
    return ratingB - ratingA;
  });

  const top5 = arr.slice(0, 5);

  for (const [key, item] of top5) {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.name}</a> - ⭐ ${(item.votes ? (item.rating / item.votes).toFixed(2) : '0')}`;
    rankingList.appendChild(li);
  }
}

// Nasłuchuj zmian w Firebase
database.ref('groups').on('value', snapshot => {
  allGroups = snapshot.val() || {};
  renderLists();
});
database.ref('channels').on('value', snapshot => {
  allChannels = snapshot.val() || {};
  renderLists();
});

// Sortowanie - podpięte pod przyciski
sortButtons.forEach(button => {
  button.addEventListener('click', () => {
    currentSort = button.getAttribute('data-sort');
    renderLists();
  });
});

// Wyszukiwarka
searchInput.addEventListener('input', () => {
  renderLists();
});
