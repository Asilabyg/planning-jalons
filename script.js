// ✅ Backend Render
const API_URL = "https://jalons-backend.onrender.com";

let jalons = [];

// ===============================
// ✅ Charger jalons depuis backend
// ===============================
async function loadSavedData() {
    const res = await fetch(`${API_URL}/jalons`);
    jalons = await res.json();
    loadTable();
}

// ===============================
// ✅ Ajouter un jalon (Planning date FIXE)
// ===============================
async function addJalon() {
    const name = newName.value;
    const area = newArea.value;
    const type = newType.value;
    const pic = newPIC.value;
    const planningDate = newPlanningDate.value;
    const planning = newPlanning.value;

    if (!name || !area || !type || !pic || !planningDate || !planning) {
        alert("Merci de remplir tous les champs.");
        return;
    }

    const newJalon = {
        id: Date.now(),
        nom: name,
        area,
        type,
        pic,
        planningDate,             // ✅ FIXE à la création
        currentForecast: planningDate, // ✅ Forecast initiale
        forecastHistory: [planningDate],
        planning
    };

    await fetch(`${API_URL}/jalons`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(newJalon)
    });

    jalons.push(newJalon);
    loadTable();

    document.querySelectorAll("#addForm input, #addForm select").forEach(el => el.value = "");
}

// ===============================
// ✅ Mettre à jour la forecast + historique
// ===============================
async function updateForecast(id, newDate) {
    const jalon = jalons.find(j => j.id === id);

    jalon.currentForecast = newDate;
    jalon.forecastHistory.push(newDate);

    await fetch(`${API_URL}/jalons/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(jalon)
    });

    loadTable();
}

// ===============================
// ✅ Statut : cercle couleur
// ===============================
function getStatusColor(j) {
    const p = new Date(j.planningDate);
    const f = new Date(j.currentForecast);

    if (f > p) return "#ff4d4d";     // Rouge = retard
    if (f.getTime() === p.getTime()) return "#ffc107"; // Jaune = pile le même jour
    return "#4caf50";                // Vert = en avance
}

// ===============================
// ✅ Affichage du tableau
// ===============================
function loadTable() {
    const tbody = document.querySelector("#jalonsTable tbody");
    tbody.innerHTML = "";

    jalons.sort((a, b) => new Date(a.planningDate) - new Date(b.planningDate));

    jalons.forEach(jalon => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><div class="status-circle" style="background:${getStatusColor(jalon)}"></div></td>
            <td>${jalon.nom}</td>
            <td>${jalon.area}</td>
            <td>${jalon.type}</td>
            <td>${jalon.pic}</td>
            <td>${jalon.planningDate}</td>

            <td>
                <input type="date" value="${jalon.currentForecast}"
                       onchange="updateForecast(${jalon.id}, this.value)">
            </td>

            <td>${jalon.planning}</td>
        `;

        tbody.appendChild(tr);
    });
}

loadSavedData();