const webhookURL = "https://discord.com/api/webhooks/1390094366764306533/QuQVXQaVmT_ozabnxo8lQH09uhDBQN924aOvU41a53pZtmUHjiMerBk5SyrsTNMu5Udl"; // <== Uzupełnij

let currentSort = "new"; // domyślnie: najnowsze

async function sendToDiscord(data) {
  const payload = {
    content: `🆕 Nowy wpis:
📌 Typ: ${data.type}
🏷️ Nazwa: ${data.name}
🔗 Link: ${data.link}`,
  };

  try {
    await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    star.addEventListener("click", () => {
      saveRating(link, i);
      renderLists();
    });
    container.appendChild(star);
  }
}

function sortEntries(entries) {
  if (currentSort === "new") return entries.reverse();
  if (currentSort === "best") {
    return entries.sort((a, b) => getRatingFor(b.link) - getRatingFor(a.link));
  }
  return entries;
}

function renderLists() {
  const entries = sortEntries(getEntries());
  const searchValue = document.getElementById("searchInput").value.toLowerCase();

  const groupList = document.getElementById("groupList");
  const channelList = document.getElementById("channelList");

  groupList.innerHTML = "";
  channelList.innerHTML = "";

  entries.forEach(entry => {
    if (!entry.name.toLowerCase().includes(searchValue)) return;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${entry.name}</strong><br/>
      <a href="${entry.link}" target="_blank">Otwórz</a>
    `;

    const starsDiv = document.createElement("div");
    starsDiv.className = "stars";
    renderStars(entry.link, starsDiv);
    li.appendChild(starsDiv);

    if (entry.type === "Grupa") groupList.appendChild(li);
    else channelList.appendChild(li);
  });

  renderRanking(entries);
}

function renderRanking(entries) {
  const rankingList = document.getElementById("rankingList");
  rankingList.innerHTML = "";

  const sorted = [...entries]
    .map(entry => ({ ...entry, rating: getRatingFor(entry.link) }))
    .filter(e => e.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  sorted.forEach(entry => {
    const li = document.createElement("li");
    li.innerHTML = `⭐ <strong>${entry.name}</strong> – Ocena: ${entry.rating}/5`;
    rankingList.appendChild(li);
  });
}

document.querySelector("#addForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const data = {
    name: document.querySelector("#name").value.trim(),
    link: document.querySelector("#link").value.trim(),
    type: document.querySelector("#type").value,
  };

  if (!data.name || !data.link || !data.type) return;

  const entries = getEntries();
  entries.push(data);
  saveEntries(entries);
  sendToDiscord(data);
  this.reset();
  renderLists();
  alert("Dodano!");
});

document.getElementById("searchInput").addEventListener("input", renderLists);

document.querySelectorAll("[data-sort]").forEach(btn => {
  btn.addEventListener("click", () => {
    currentSort = btn.dataset.sort;
    renderLists();
  });
});

renderLists();
