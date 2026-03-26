// Liste de jalons (tu pourras en ajouter plus tard)
let jalons = [
    { id: 1, nom: "Kick-off", date: "2026-04-15" },
    { id: 2, nom: "Design Freeze", date: "2026-06-30" },
    { id: 3, nom: "Fabrication Start", date: "2026-09-01" }
];

function getStatusColor(date) {
    const today = new Date();
    const d = new Date(date);
    const diff = (d - today) / (1000 * 3600 * 24);

    if (diff < 0) return "#ffb3b3";      // Rouge clair
    if (diff < 15) return "#ffe5b3";     // Orange clair
    return "#d6f5d6";                    // Vert clair
}

function loadTable() {
    const tbody = document.querySelector("#jalonsTable tbody");
    tbody.innerHTML = "";

    jalons.forEach(jalon => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${jalon.nom}</td>
            <td>
                <input type="date" value="${jalon.date}" 
                    onchange="updateDate(${jalon.id}, this.value)">
            </td>
            <td>
                <button onclick="saveData()">💾 Sauvegarder</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
    tr.style.backgroundColor = getStatusColor(jalon.date);
    jalons.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function updateDate(id, newDate) {
    const jalon = jalons.find(j => j.id === id);
    jalon.date = newDate;
}

function saveData() {
    localStorage.setItem("jalons", JSON.stringify(jalons));
    alert("Dates sauvegardées !");
}

function loadSavedData() {
    const saved = localStorage.getItem("jalons");
    if (saved) {
        jalons = JSON.parse(saved);
    }
}

function addJalon() {
    const name = document.getElementById("newName").value;
    const date = document.getElementById("newDate").value;

    if (!name || !date) {
        alert("Merci de remplir tous les champs.");
        return;
    }

    const newId = Math.max(...jalons.map(j => j.id)) + 1;

    jalons.push({
        id: newId,
        nom: name,
        date: date
    });

    saveData();
    loadTable();

    document.getElementById("newName").value = "";
    document.getElementById("newDate").value = "";
}

loadSavedData();
loadTable();
``