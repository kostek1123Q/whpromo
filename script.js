const form = document.getElementById('addForm');
const groupList = document.getElementById('groupList');
const channelList = document.getElementById('channelList');
const rankingList = document.getElementById('rankingList');
const searchInput = document.getElementById('searchInput');
const adminToggle = document.getElementById('adminToggle');

let isAdmin = false;

let items = JSON.parse(localStorage.getItem('whpromo-items')) || [];

function saveItems() {
  localStorage.setItem('whpromo-items', JSON.stringify(items));
}

function renderLists() {
  groupList.innerHTML = '';
  channelList.innerHTML = '';
  rankingList.innerHTML = '';

  // Sortowanie ranking top 5 (po ocenie)
  const topItems = [...items].sort((a, b) => b.rating - a.rating).slice(0, 5);

  topItems.forEach(item => {
    const li = createListItem(item, true);
    rankingList.appendChild(li);
  });

  items.forEach(item => {
    const li = createListItem(item, false);
    if (item.type === 'Grupa') groupList.appendChild(li);
    else if (item.type === 'Kanał') channelList.appendChild(li);
  });
}

function createListItem(item, isRanking) {
  const li = document.createElement('li');
  li.dataset.id = item.id;

  const leftDiv = document.createElement('div');
  leftDiv.style.flex = '1';

  const a = document.createElement('a');
  a.href = item.link;
  a.textContent = item.name;
  a.target = '_blank';
  a.style.color = '#25d366';
  a.style.textDecoration = 'none';
  leftDiv.appendChild(a);

  const ratingDiv = document.createElement('div');
  ratingDiv.classList.add('rating-stars');

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.innerHTML = '★';
    star.style.color = i <= item.rating ? '#25d366' : '#555';
    star.dataset.value = i;
    if (!isRanking && isAdmin) {
      star.style.cursor = 'pointer';
      star.addEventListener('click', () => {
        item.rating = i;
        saveItems();
        sendDiscordWebhook(`Rating updated: ${item.name} now has ${item.rating} stars.`);
        renderLists();
      });
    }
    ratingDiv.appendChild(star);
  }

  li.appendChild(leftDiv);
  li.appendChild(ratingDiv);

  if (!isRanking && isAdmin) {
    // Edytuj i usuń przyciski tylko dla admina
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edytuj';
    editBtn.classList.add('edit-btn');
    editBtn.addEventListener('click', () => editItem(item.id));
    li.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Usuń';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Usunąć ${item.name}?`)) {
        items = items.filter(i => i.id !== item.id);
        saveItems();
        sendDiscordWebhook(`Item deleted: ${item.name}`);
        renderLists();
      }
    });
    li.appendChild(deleteBtn);
  }

  return li;
}

function editItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  const newName = prompt('Nowa nazwa:', item.name);
  if (newName) item.name = newName;

  const newLink = prompt('Nowy link:', item.link);
  if (newLink) item.link = newLink;

  saveItems();
  sendDiscordWebhook(`Item edited: ${item.name}`);
  renderLists();
}

form.addEventListener('submit', e => {
  e.preventDefault();
  if (!isAdmin) {
    alert('Tylko admin może dodawać elementy!');
    return;
  }

  const name = form.name.value.trim();
  const link = form.link.value.trim();
  const type = form.type.value;

  if (!name || !link || !type) return alert('Wypełnij wszystkie pola!');

  const newItem = {
    id: Date.now().toString(),
    name,
    link,
    type,
    rating: 0,
    created: Date.now()
  };

  items.push(newItem);
  saveItems();
  sendDiscordWebhook(`Item added: ${name} (${type})`);
  renderLists();
  form.reset();
});

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  filterLists(query);
});

function filterLists(query) {
  [...groupList.children].forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
  [...channelList.children].forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
  [...rankingList.children].forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
}

document.querySelectorAll('.sort-buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.sort === 'new') {
      items.sort((a, b) => b.created - a.created);
    } else if (btn.dataset.sort === 'best') {
      items.sort((a, b) => b.rating - a.rating);
    }
    renderLists();
  });
});

adminToggle.addEventListener('click', () => {
  isAdmin = !isAdmin;
  adminToggle.textContent = isAdmin ? 'Tryb Użytkownika' : 'Tryb Admina';
  renderLists();
});

// Discord webhook
const discordWebhookURL = "https://discord.com/api/webhooks/1390094366764306533/QuQVXQaVmT_ozabnxo8lQH09uhDBQN924aOvU41a53pZtmUHjiMerBk5SyrsTNMu5Udl";

function sendDiscordWebhook(message) {
  fetch(discordWebhookURL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({content: message})
  }).catch(err => console.error('Webhook error:', err));
}

// Initial render
renderLists();
