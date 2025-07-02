const webhookURL = "https://discord.com/api/webhooks/1390094366764306533/QuQVXQaVmT_ozabnxo8lQH09uhDBQN924aOvU41a53pZtmUHjiMerBk5SyrsTNMu5Udl";

let currentSort = "new";
const ADMIN_PASSWORD = "admin123"; // Zmień hasło admina jeśli chcesz

function isAdmin() {
  return sessionStorage.getItem("isAdmin") === "true";
}

function toggleAdmin() {
  if (isAdmin()) {
    sessionStorage.removeItem("isAdmin");
    alert("Wylogowano z trybu admina.");
    renderLists();
  } else {
    const pass = prompt("Podaj hasło admina:");
    if (pass === ADMIN_PASSWORD) {
      sessionStorage.setItem("isAdmin", "true");
      alert("Zalogowano jako admin!");
      renderLists();
    } else {
      alert("Błędne hasło.");
    }
  }
}

document.getElementById("adminToggle").addEventListener("click", toggleAdmin);

async function sendToDiscord(data) {
  const payload = {
    content: `🆕 Nowy wpis:
📌 Typ: ${data.type}
🏷️ Nazwa: ${data.name}
🔗 Link: ${data.link}`
  };

  try {
    await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Błąd webhooka:", err);
  }
}

function getEntries() {
  return JSON.parse(localStorage.getItem("entries") || "[]");
}

function saveEntries(entries) {
  localStorage.setItem("entries", JSON.stringify(entries));
}

function getRatings() {
  return JSON.parse(localStorage.getItem("ratings") || "{}");
}

function saveRating(link, rating) {
  const ratings = getRatings();
  ratings[link] = rating;
  localStorage.setItem("ratings", JSON.stringify(ratings));
}

function getRatingFor(link) {
  const ratings = getRatings();
  return ratings[link] || 0;
}

function renderStars(link, container) {
  container.innerHTML = "";
  const currentRating = getRatingFor(link);

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.classList.add("star");
    if (i <= currentRating) star.classList.add("filled");
    star.innerHTML = "★";
    star.title = `Oceń ${i} gwiazdek`;
    star.addEventListener("click", () => {
      saveRating(link, i);
      renderLists();
    });
    container.appendChild(star);
  }
}

function sortEntries(entries) {
  if (currentSort === "new") return entries.slice().reverse();
  if (currentSort === "best") {
    return entries.slice().sort((a, b) => getRatingFor(b.link) - getRatingFor(a.link));
  }
  return entries;
}

function renderLists() {
  const entries = sortEntries(getEntries());
  const searchValue = document.getElementById("searchInput").value.toLowerCase();

  const groupList = document.getElementById("groupList");
  const channelList = document.getElementById("channelList");
  const rankingList = document.getElementById("rankingList");

  groupList.innerHTML = "";
  channelList.innerHTML = "";
  rankingList.innerHTML = "";

  entries.forEach(entry => {
    if (!entry.name.toLowerCase().includes(searchValue)) return;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${entry.name}</strong><br/>
      <a href="${entry.link}" target="_blank" rel="noopener noreferrer">Otwórz</a>
    `;

    const starsDiv = document.createElement("div");
    starsDiv.className = "stars";
    renderStars(entry.link, starsDiv);
    li.appendChild(starsDiv);

    if (isAdmin()) {
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "entry-actions";

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edytuj";
      editBtn.className = "edit-btn";
      editBtn.addEventListener("click", () => editEntry(entry.link));

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Usuń";
      deleteBtn.className = "delete-btn";
      deleteBtn.addEventListener("click", () => deleteEntry(entry.link));

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);
      li.appendChild(actionsDiv);
    }

    if (entry.type === "Grupa") groupList.appendChild(li);
    else if (entry.type === "Kanał") channelList.appendChild(li);
  });

  // Ranking TOP 5 (wszystkie typy razem, posortowane po ocenach malejąco)
  const topEntries = entries
    .filter(e => e.name.toLowerCase().includes(searchValue))
    .sort((a, b) => getRatingFor(b.link) - getRatingFor(a.link))
    .slice(0, 5);

  topEntries.forEach(entry => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${entry.name}</strong> (${entry.type})<br/>
      <a href="${entry.link}" target="_blank" rel="noopener noreferrer">Otwórz</a>
    `;

    const starsDiv = document.createElement("div");
    starsDiv.className = "stars";
    renderStars(entry.link, starsDiv);
    li.appendChild(starsDiv);

    rankingList.appendChild(li);
  });
}

function editEntry(link) {
  const entries = getEntries();
  const entry = entries.find(e => e.link === link);
  if (!entry) return alert("Nie znaleziono wpisu.");

  const newName = prompt("Nowa nazwa:", entry.name);
  if (!newName) return;

  const newLink = prompt("Nowy link:", entry.link);
  if (!newLink) return;

  const newType = prompt("Nowy typ (Grupa/Kanał):", entry.type);
  if (!newType || (newType !== "Grupa" && newType !== "Kanał")) return alert("Niepoprawny typ.");

  entry.name = newName;
  entry.link = newLink;
  entry.type = newType;

  saveEntries(entries);
  renderLists();
}

function deleteEntry(link) {
  if (!confirm("Na pewno chcesz usunąć ten wpis?")) return;

  let entries = getEntries();
  entries = entries.filter(e => e.link !== link);
  saveEntries(entries);
  renderLists();
}

document.getElementById("addForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const link = document.getElementById("link").value.trim();
  const type = document.getElementById("type").value;

  if (!name || !link || !type) return alert("Uzupełnij wszystkie pola.");

  const entries = getEntries();

  if (entries.find(e => e.link === link)) {
    return alert("Ten link już istnieje na liście.");
  }

  const newEntry = { name, link, type, createdAt: Date.now() };
  entries.push(newEntry);
  saveEntries(entries);

  await sendToDiscord(newEntry);

  e.target.reset();
  renderLists();
});

document.getElementById("searchInput").addEventListener("input", renderLists);

document.querySelectorAll(".sort-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    currentSort = btn.dataset.sort;
    renderLists();
  });
});

renderLists();
