// ✅ Adresse de ton backend
// Quand ton backend sera sur Render, tu remplacerais par :
// const API_URL = "https://ton-backend.onrender.com";
const API_URL = "https://jalons-backend.onrender.com";

// ===============================
// ✅ Charger les jalons depuis le backend
// ===============================
async function loadSavedData() {
    const res = await fetch(`${API_URL}/jalons`);
    jalons = await res.json();
    loadTable();
}

// ===============================
// ✅ Sauvegarder (ajouter) un jalon dans le backend
// ===============================

async function addJalon() {
    const name = document.getElementById("newName").value;
    const area = document.getElementById("newArea").value;
    const type = document.getElementById("newType").value;
    const pic = document.getElementById("newPIC").value;
    const date = document.getElementById("newDate").value;
    const planning = document.getElementById("newPlanning").value;

    if (!name || !area || !type || !pic || !date || !planning) {
        alert("Merci de remplir tous les champs.");
        return;
    }

    const newJalon = {
        id: Date.now(),
        nom: name,
        area: area,
        type: type,
        pic: pic,
        date: date,
        planning: planning
    };

    // ✅ Envoyer au backend
    await fetch(`${API_URL}/jalons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJalon)
    });

    // ✅ Ajouter instantanément au tableau local
    jalons.push(newJalon);

    // ✅ Afficher immédiatement dans l'interface (pas besoin de reload)
    loadTable();

    // ✅ Effacer le formulaire
    document.querySelectorAll("#addForm input, #addForm select").forEach(el => el.value = "");
}


// ===============================
// ✅ Mettre à jour un jalon (date)
// ===============================
async function updateDate(id, newDate) {
    const jalon = jalons.find(j => j.id === id);
    jalon.date = newDate;

    await fetch(`${API_URL}/jalons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jalon)
    });

    loadSavedData();
}

// ===============================
// ✅ Affichage du tableau
// ===============================
function getStatusColor(date) {
    const today = new Date();
    const d = new Date(date);
    const diff = (d - today) / (1000 * 3600 * 24);

    if (diff < 0) return "#ffb3b3";      // rouge
    if (diff < 15) return "#ffe5b3";     // orange
    return "#d6f5d6";                    // vert
}

function loadTable() {
    const tbody = document.querySelector("#jalonsTable tbody");
    tbody.innerHTML = "";

    jalons.sort((a, b) => new Date(a.date) - new Date(b.date));

    jalons.forEach(jalon => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${jalon.nom || ""}</td>
            <td>${jalon.area || ""}</td>
            <td>${jalon.type || ""}</td>
            <td>${jalon.pic || ""}</td>
            <td>
                <input type="date" value="${jalon.date}"
                       onchange="updateDate(${jalon.id}, this.value)">
            </td>
            <td>${jalon.planning || ""}</td>
            <td>
                <button onclick="loadSavedData()">💾</button>
            </td>
        `;

        tr.style.backgroundColor = getStatusColor(jalon.date);

        tbody.appendChild(tr);
    });
}

// ===============================
// ✅ Lancer au démarrage
// ===============================
let jalons = [];
loadSavedData();