const API_URL = "https://jalons-backend.onrender.com";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const state = {
    page: document.body.dataset.page || "",
    jalons: [],
    loading: false,
    editingId: null,
    filters: {
        search: "",
        type: "all",
        status: "all",
        sortBy: "planningDateAsc"
    }
};

document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    loadSavedData();
});

function bindEvents() {
    if (state.page === "input") {
        element("jalonForm")?.addEventListener("submit", handleFormSubmit);
        element("cancelEditButton")?.addEventListener("click", resetForm);
        element("refreshTableButton")?.addEventListener("click", () => loadSavedData("Tableau actualisé."));

        ["filterSearch", "filterType", "filterStatus", "sortBy"].forEach((id) => {
            const input = element(id);
            if (!input) {
                return;
            }

            input.addEventListener(id === "filterSearch" ? "input" : "change", handleFilterChange);
        });
    }

    if (state.page === "visualisation") {
        element("refreshVisualsButton")?.addEventListener("click", () => loadSavedData("Indicateurs actualisés."));
    }

    if (state.page === "home") {
        element("refreshOverviewButton")?.addEventListener("click", () => loadSavedData("Aperçu actualisé."));
    }
}

function element(id) {
    return document.getElementById(id);
}

function parseDate(value) {
    return value ? new Date(`${value}T00:00:00`) : null;
}

function isValidDate(value) {
    const date = parseDate(value);
    return Boolean(date) && !Number.isNaN(date.getTime());
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = parseDate(value);
    return Number.isNaN(date?.getTime()) ? value : date.toLocaleDateString("fr-FR");
}

function getDelayDays(jalon) {
    const planningDate = parseDate(jalon.planningDate);
    const forecastDate = parseDate(jalon.currentForecast || jalon.planningDate);

    if (!planningDate || !forecastDate) {
        return 0;
    }

    return Math.round((forecastDate.getTime() - planningDate.getTime()) / DAY_IN_MS);
}

function getStatus(jalon) {
    const delayDays = getDelayDays(jalon);

    if (delayDays > 0) {
        return "late";
    }

    if (delayDays === 0) {
        return "ontime";
    }

    return "ahead";
}

function getStatusLabel(status) {
    return {
        late: "En retard",
        ontime: "À l'heure",
        ahead: "En avance"
    }[status] || "Inconnu";
}

function getStatusMarkup(jalon) {
    const status = getStatus(jalon);
    return `
        <span class="status-badge">
            <span class="status-dot status-${status}" aria-hidden="true"></span>
            ${getStatusLabel(status)}
        </span>
    `;
}

function getSummary(jalons) {
    return jalons.reduce((summary, jalon) => {
        const status = getStatus(jalon);
        summary.total += 1;
        summary[status] += 1;
        return summary;
    }, {
        total: 0,
        late: 0,
        ontime: 0,
        ahead: 0
    });
}

function setLoading(isLoading) {
    state.loading = isLoading;

    ["submitButton", "refreshTableButton", "refreshVisualsButton", "refreshOverviewButton", "cancelEditButton"].forEach((id) => {
        const button = element(id);
        if (button) {
            button.disabled = isLoading;
        }
    });

    if (state.page === "input") {
        const tableMessage = element("tableMessage");
        if (tableMessage && isLoading) {
            tableMessage.textContent = "Chargement des jalons...";
        }
    }
}

function showMessage(id, type, message) {
    const target = element(id);
    if (!target) {
        return;
    }

    if (!message) {
        target.textContent = "";
        target.className = "feedback hidden";
        return;
    }

    target.textContent = message;
    target.className = `feedback feedback-${type}`;
}

function showGlobalMessage(type, message) {
    showMessage("globalMessage", type, message);
}

async function request(path, options = {}) {
    const config = {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };

    if (options.body !== undefined) {
        config.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    }

    const response = await fetch(`${API_URL}${path}`, config);

    if (!response.ok) {
        throw new Error(`Erreur API (${response.status})`);
    }

    const raw = await response.text();
    return raw ? JSON.parse(raw) : null;
}

async function loadSavedData(successMessage = "") {
    setLoading(true);
    showGlobalMessage("", "");

    try {
        const data = await request("/jalons");
        state.jalons = Array.isArray(data) ? data : [];
        renderPage();

        if (successMessage) {
            showGlobalMessage("success", successMessage);
        }
    } catch (error) {
        showGlobalMessage("error", "Impossible de charger les jalons pour le moment. Vérifiez la connexion au backend puis réessayez.");
        state.jalons = [];
        renderPage();
    } finally {
        setLoading(false);
    }
}

function handleFilterChange(event) {
    state.filters[event.target.id === "filterSearch" ? "search" : event.target.id.replace("filter", "").replace(/^./, (character) => character.toLowerCase())] = event.target.value;

    if (event.target.id === "sortBy") {
        state.filters.sortBy = event.target.value;
    }

    if (event.target.id === "filterType") {
        state.filters.type = event.target.value;
    }

    if (event.target.id === "filterStatus") {
        state.filters.status = event.target.value;
    }

    renderInputPage();
}

function getFormValues() {
    const planningDate = element("newPlanningDate")?.value || "";
    const currentForecast = element("newForecastDate")?.value || planningDate;

    return {
        nom: element("newName")?.value.trim() || "",
        area: element("newArea")?.value.trim() || "",
        type: element("newType")?.value || "",
        pic: element("newPIC")?.value.trim() || "",
        planningDate,
        currentForecast,
        planning: element("newPlanning")?.value.trim() || ""
    };
}

function validateForm(values) {
    const missingFields = [];

    if (!values.nom) missingFields.push("le nom du jalon");
    if (!values.area) missingFields.push("l'area");
    if (!values.type) missingFields.push("le type");
    if (!values.pic) missingFields.push("la personne responsable");
    if (!values.planningDate) missingFields.push("la date planning");
    if (!values.planning) missingFields.push("le nom du planning");

    if (missingFields.length) {
        return `Merci de renseigner ${missingFields.join(", ")}.`;
    }

    if (!isValidDate(values.currentForecast) || !isValidDate(values.planningDate)) {
        return "Les dates saisies sont invalides.";
    }

    return "";
}

function buildForecastHistory(previousJalon, currentForecast) {
    const existingHistory = Array.isArray(previousJalon?.forecastHistory) && previousJalon.forecastHistory.length
        ? [...previousJalon.forecastHistory]
        : [previousJalon?.planningDate].filter(Boolean);

    if (currentForecast && existingHistory[existingHistory.length - 1] !== currentForecast) {
        existingHistory.push(currentForecast);
    }

    return existingHistory.length ? existingHistory : [currentForecast];
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const values = getFormValues();
    const validationError = validateForm(values);

    if (validationError) {
        showMessage("formMessage", "error", validationError);
        return;
    }

    showMessage("formMessage", "", "");
    setLoading(true);

    try {
        if (state.editingId) {
            const previousJalon = state.jalons.find((jalon) => jalon.id === state.editingId);
            const updatedJalon = {
                ...previousJalon,
                ...values,
                forecastHistory: buildForecastHistory(previousJalon, values.currentForecast)
            };

            await request(`/jalons/${state.editingId}`, {
                method: "PUT",
                body: updatedJalon
            });

            await loadSavedData("Le jalon a été mis à jour.");
        } else {
            const newJalon = {
                id: Date.now(),
                ...values,
                forecastHistory: [values.currentForecast]
            };

            await request("/jalons", {
                method: "POST",
                body: newJalon
            });

            await loadSavedData("Le jalon a été ajouté.");
        }

        resetForm();
    } catch (error) {
        showMessage("formMessage", "error", "L'enregistrement a échoué. Vérifiez la disponibilité du backend puis réessayez.");
    } finally {
        setLoading(false);
    }
}

function resetForm() {
    element("jalonForm")?.reset();
    state.editingId = null;

    const submitButton = element("submitButton");
    const cancelButton = element("cancelEditButton");

    if (submitButton) {
        submitButton.textContent = "Ajouter le jalon";
    }

    if (cancelButton) {
        cancelButton.classList.add("hidden");
    }

    showMessage("formMessage", "", "");
}

function startEdit(id) {
    const jalon = state.jalons.find((item) => item.id === id);
    if (!jalon) {
        return;
    }

    state.editingId = id;
    element("newName").value = jalon.nom || "";
    element("newArea").value = jalon.area || "";
    element("newType").value = jalon.type || "";
    element("newPIC").value = jalon.pic || "";
    element("newPlanningDate").value = jalon.planningDate || "";
    element("newForecastDate").value = jalon.currentForecast || jalon.planningDate || "";
    element("newPlanning").value = jalon.planning || "";

    element("submitButton").textContent = "Mettre à jour le jalon";
    element("cancelEditButton").classList.remove("hidden");
    showGlobalMessage("success", `Modification prête pour « ${jalon.nom} ».`);
    element("newName")?.focus();
}

async function deleteJalon(id) {
    const jalon = state.jalons.find((item) => item.id === id);
    if (!jalon) {
        return;
    }

    const confirmed = window.confirm(`Supprimer le jalon « ${jalon.nom} » ?`);
    if (!confirmed) {
        return;
    }

    setLoading(true);

    try {
        await request(`/jalons/${id}`, { method: "DELETE" });
        if (state.editingId === id) {
            resetForm();
        }
        await loadSavedData("Le jalon a été supprimé.");
    } catch (error) {
        showGlobalMessage("error", "La suppression a échoué. Vérifiez la disponibilité du backend puis réessayez.");
    } finally {
        setLoading(false);
    }
}

function getFilteredAndSortedJalons() {
    const searchTerm = state.filters.search.trim().toLowerCase();

    const filtered = state.jalons.filter((jalon) => {
        const status = getStatus(jalon);
        const searchableContent = [jalon.nom, jalon.area, jalon.pic, jalon.planning, jalon.type]
            .join(" ")
            .toLowerCase();

        const matchesSearch = !searchTerm || searchableContent.includes(searchTerm);
        const matchesType = state.filters.type === "all" || jalon.type === state.filters.type;
        const matchesStatus = state.filters.status === "all" || status === state.filters.status;

        return matchesSearch && matchesType && matchesStatus;
    });

    return filtered.sort((first, second) => {
        switch (state.filters.sortBy) {
            case "planningDateDesc":
                return parseDate(second.planningDate) - parseDate(first.planningDate);
            case "forecastAsc":
                return parseDate(first.currentForecast || first.planningDate) - parseDate(second.currentForecast || second.planningDate);
            case "forecastDesc":
                return parseDate(second.currentForecast || second.planningDate) - parseDate(first.currentForecast || first.planningDate);
            case "nameAsc":
                return (first.nom || "").localeCompare(second.nom || "", "fr", { sensitivity: "base" });
            case "planningDateAsc":
            default:
                return parseDate(first.planningDate) - parseDate(second.planningDate);
        }
    });
}

function createSummaryCard(label, value, helper = "") {
    return `
        <article class="summary-card">
            <span class="summary-label">${label}</span>
            <strong class="summary-value">${value}</strong>
            ${helper ? `<p>${helper}</p>` : ""}
        </article>
    `;
}

function renderHomePage() {
    const summary = getSummary(state.jalons);
    const homeOverview = element("homeOverview");
    const highlights = element("homeHighlights");

    if (!homeOverview || !highlights) {
        return;
    }

    homeOverview.innerHTML = [
        createSummaryCard("Total de jalons", summary.total, "Tous les jalons actuellement suivis."),
        createSummaryCard("En retard", summary.late, "Forecast postérieure à la date planning."),
        createSummaryCard("À l'heure", summary.ontime, "Forecast identique à la date planning."),
        createSummaryCard("En avance", summary.ahead, "Forecast antérieure à la date planning.")
    ].join("");

    const critical = [...state.jalons]
        .filter((jalon) => getStatus(jalon) === "late")
        .sort((first, second) => getDelayDays(second) - getDelayDays(first))
        .slice(0, 2);

    const latestForecastChange = [...state.jalons]
        .filter((jalon) => Array.isArray(jalon.forecastHistory) && jalon.forecastHistory.length > 1)
        .sort((first, second) => (second.forecastHistory?.length || 0) - (first.forecastHistory?.length || 0))[0];

    highlights.innerHTML = `
        <article class="insight-card">
            <h3>Point d'attention principal</h3>
            <p>${critical.length ? `${escapeHtml(critical[0].nom)} affiche ${getDelayDays(critical[0])} jour(s) de retard.` : "Aucun jalon en retard pour le moment."}</p>
        </article>
        <article class="insight-card">
            <h3>Dernier jalon mouvant</h3>
            <p>${latestForecastChange ? `${escapeHtml(latestForecastChange.nom)} a déjà connu ${latestForecastChange.forecastHistory.length - 1} évolution(s) de forecast.` : "Aucun historique de forecast multiple disponible."}</p>
        </article>
    `;
}

function renderInputPage() {
    const tbody = document.querySelector("#jalonsTable tbody");
    const tableMessage = element("tableMessage");

    if (!tbody || !tableMessage) {
        return;
    }

    const jalons = getFilteredAndSortedJalons();
    tbody.innerHTML = "";

    if (!jalons.length) {
        tableMessage.textContent = state.jalons.length
            ? "Aucun jalon ne correspond aux filtres actuels."
            : "Aucun jalon disponible pour le moment.";
        return;
    }

    tableMessage.textContent = `${jalons.length} jalon(s) affiché(s).`;

    jalons.forEach((jalon) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${getStatusMarkup(jalon)}</td>
            <td>
                <strong>${escapeHtml(jalon.nom || "—")}</strong>
                <div class="table-subtext">${Math.abs(getDelayDays(jalon))} jour(s) ${getDelayDays(jalon) > 0 ? "de retard" : getDelayDays(jalon) < 0 ? "d'avance" : "d'écart"}</div>
            </td>
            <td>${escapeHtml(jalon.area || "—")}</td>
            <td>${escapeHtml(jalon.type || "—")}</td>
            <td>${escapeHtml(jalon.pic || "—")}</td>
            <td>${formatDate(jalon.planningDate)}</td>
            <td>${formatDate(jalon.currentForecast || jalon.planningDate)}</td>
            <td>${escapeHtml(jalon.planning || "—")}</td>
            <td>
                <div class="action-group">
                    <button class="button button-secondary" type="button" data-action="edit" data-id="${jalon.id}">Modifier</button>
                    <button class="button button-danger" type="button" data-action="delete" data-id="${jalon.id}">Supprimer</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll("button[data-action='edit']").forEach((button) => {
        button.addEventListener("click", () => startEdit(Number(button.dataset.id)));
    });

    tbody.querySelectorAll("button[data-action='delete']").forEach((button) => {
        button.addEventListener("click", () => deleteJalon(Number(button.dataset.id)));
    });
}

function buildGroupedSummary(field) {
    const grouped = state.jalons.reduce((accumulator, jalon) => {
        const key = jalon[field] || "Non renseigné";
        const item = accumulator.get(key) || { name: key, total: 0, late: 0 };
        item.total += 1;
        if (getStatus(jalon) === "late") {
            item.late += 1;
        }
        accumulator.set(key, item);
        return accumulator;
    }, new Map());

    return [...grouped.values()].sort((first, second) => second.total - first.total || first.name.localeCompare(second.name, "fr", { sensitivity: "base" }));
}

function renderGroupList(targetId, groups) {
    const target = element(targetId);
    if (!target) {
        return;
    }

    if (!groups.length) {
        target.innerHTML = '<p class="empty-state">Aucune donnée disponible.</p>';
        return;
    }

    target.innerHTML = `
        <div class="list-stack">
            ${groups.slice(0, 6).map((group) => `
                <div class="list-item">
                    <div>
                        <strong>${escapeHtml(group.name)}</strong>
                        <div class="list-item-meta">${group.total} jalon(s)</div>
                    </div>
                    <span class="metric-pill">${group.late} retard(s)</span>
                </div>
            `).join("")}
        </div>
    `;
}

function renderVisualisationPage() {
    const summary = getSummary(state.jalons);
    const overviewStats = element("overviewStats");
    const criticalList = element("criticalList");

    if (overviewStats) {
        overviewStats.innerHTML = [
            createSummaryCard("Total", summary.total),
            createSummaryCard("En retard", summary.late),
            createSummaryCard("À l'heure", summary.ontime),
            createSummaryCard("En avance", summary.ahead)
        ].join("");
    }

    renderGroupList("summaryByArea", buildGroupedSummary("area"));
    renderGroupList("summaryByType", buildGroupedSummary("type"));
    renderGroupList("summaryByPlanning", buildGroupedSummary("planning"));

    if (!criticalList) {
        return;
    }

    const criticalJalons = [...state.jalons]
        .filter((jalon) => getStatus(jalon) === "late")
        .sort((first, second) => getDelayDays(second) - getDelayDays(first))
        .slice(0, 5);

    if (!criticalJalons.length) {
        criticalList.innerHTML = '<p class="empty-state">Aucun jalon critique identifié actuellement.</p>';
        return;
    }

    criticalList.innerHTML = criticalJalons.map((jalon) => `
        <article class="critical-item">
            <div class="status-badge">
                <span class="status-dot status-late" aria-hidden="true"></span>
                ${escapeHtml(jalon.nom)}
            </div>
            <div class="list-item-meta">Area : ${escapeHtml(jalon.area || "—")} · PIC : ${escapeHtml(jalon.pic || "—")}</div>
            <div class="list-item-meta">Planning : ${formatDate(jalon.planningDate)} · Forecast : ${formatDate(jalon.currentForecast || jalon.planningDate)}</div>
            <span class="metric-pill">${getDelayDays(jalon)} jour(s) de retard</span>
        </article>
    `).join("");
}

function renderPage() {
    if (state.page === "home") {
        renderHomePage();
    }

    if (state.page === "input") {
        renderInputPage();
    }

    if (state.page === "visualisation") {
        renderVisualisationPage();
    }
}
