// Liste de jalons (tu pourras en ajouter plus tard)
let jalons = [
    { id: 1, nom: "Kick-off", date: "2026-04-15" },
    { id: 2, nom: "Design Freeze", date: "2026-06-30" },
    { id: 3, nom: "Fabrication Start", date: "2026-09-01" }
];

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

loadSavedData();
loadTable();
``