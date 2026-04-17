// ============================
// STATE
// ============================

let players = JSON.parse(localStorage.getItem("players") || "[]");
let editMode = false;
let statsSort = {
    key: "setsPct", // tri par défaut
    asc: false
};

// ============================
// INIT (IMPORTANT)
// ============================

console.log("🔥 APP JS LOADED:", new Date().toISOString());

console.log("Netlify auto deploy test");

document.addEventListener("DOMContentLoaded", () => {

    initEditMode();
    initHeightSelectors();
    renderPlayers();

    // cacher le formulaire au départ
    const form = document.getElementById("newPlayerForm");
    if (form) form.style.display = "none";
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log("SW registered"))
        .catch(err => console.log("SW error", err));
}

// ============================
// MODE ÉDITION
// ============================

function initEditMode() {
    editMode = false;

    document.body.classList.add("view-mode");
    document.body.classList.remove("edit-mode");

    const btn = document.getElementById("editBtn");
    if (btn) btn.innerText = "Mode édition : OFF";
}

function toggleEdit() {

    if (!editMode) {
        const code = prompt("Entrer le code d'accès :");
        if (code !== "4419") {
            alert("Code invalide");
            return;
        }
    }

    editMode = !editMode;

    document.getElementById("editBtn").innerText =
        "Mode édition : " + (editMode ? "ON" : "OFF");

    document.body.classList.toggle("edit-mode", editMode);
    document.body.classList.toggle("view-mode", !editMode);

    renderPlayers();
}

// ============================
// DIFFÉRENTS TABS
// ============================

function showTab(tab) {

    // cacher contenu
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(tab + "Tab").classList.add("active");

    // gérer boutons
    document.querySelectorAll(".tabs button").forEach(btn => {
        btn.classList.remove("active");
    });

    const activeBtn = document.querySelector(`.tabs button[onclick="showTab('${tab}')"]`);
    if (activeBtn) activeBtn.classList.add("active");

    // render spécifique
    if (tab === "history") renderHistory();
    if (tab === "stats") renderStats();
}


// ============================
// TOGGLE FORMULAIRE
// ============================

function toggleNewPlayer() {

    const form = document.getElementById("newPlayerForm");
    const btn = document.getElementById("toggleNewBtn");

    if (!form || !btn) return;

    const isHidden = form.style.display === "none" || form.style.display === "";

    form.style.display = isHidden ? "block" : "none";
    btn.innerText = isHidden ? "Masquer" : "Afficher";
}

// ============================
// STORAGE — SOURCE UNIQUE DE VÉRITÉ
// ============================

function getMatches() {
    return JSON.parse(localStorage.getItem("matches") || "[]");
}

function setMatches(data) {
    localStorage.setItem("matches", JSON.stringify(data));
}

// Alias pour compatibilité
function saveMatches() {
    setMatches(getMatches());
}

function savePlayers() {
    localStorage.setItem("players", JSON.stringify(players));
}

// ============================
// INIT HEIGHT SELECT
// ============================

function initHeightSelectors() {
    const ft = document.getElementById("newFt");
    const inch = document.getElementById("newIn");

    if (!ft || !inch) return;

    ft.innerHTML = `<option value="">Pieds</option>`;
    inch.innerHTML = `<option value="">Pouces</option>`;

    for (let i = 4; i <= 7; i++) {
        ft.innerHTML += `<option value="${i}">${i}'</option>`;
    }

    for (let i = 0; i <= 11; i++) {
        inch.innerHTML += `<option value="${i}">${i}"</option>`;
    }
}

// ============================
// UTIL
// ============================

function formatHeight(totalInches){
    const ft = Math.floor(totalInches / 12);
    const inch = totalInches % 12;
    return `${ft}'${inch}"`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-CA", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function generateOptions(min, max, selected, suffix="") {
    let html = "";
    for (let i = min; i <= max; i++) {
        html += `<option value="${i}" ${i==selected?"selected":""}>${i}${suffix}</option>`;
    }
    return html;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// ============================
// TOTALS + VALIDATION
// ============================

function computeTotals() {

    const selected = players.filter(p => p.present);

    let totals = {
        present: selected.length,
        passe: 0,
        centre: 0,
        attaque: 0,
        tech: 0,
        hommes: 0,
        femmes: 0
    };

    selected.forEach(p => {
        if (p.passe > 0) totals.passe++;
        if (p.centre > 0) totals.centre++;
        if (p.attaque > 0) totals.attaque++;
        if (p.tech > 0) totals.tech++;

        if (p.sex === "M") totals.hommes++;
        if (p.sex === "F") totals.femmes++;
    });

    return totals;
}

function validateTotals(t) {
    return {
        players: t.present >= 12,
        passe: t.passe >= 2,
        centre: t.centre >= 4,
        attaque: t.attaque >= 4,
        tech: t.tech >= 2
    };
}

// ============================
// UPDATE
// ============================

function updatePlayer(i, field, value) {

    if (field === "name" && !value.trim()) {
        alert("Nom invalide");
        renderPlayers();
        return;
    }

    if (["passe","centre","attaque","tech"].includes(field)) {
        value = Number(value);
        if (isNaN(value) || value < 0 || value > 10) {
            alert("Valeur entre 0 et 10");
            renderPlayers();
            return;
        }
    }

    players[i][field] = value;
    savePlayers();
}

function updateHeight(i, field, value) {

    value = Number(value);

    if ((field === "ft" && (value < 4 || value > 7)) ||
        (field === "inch" && (value < 0 || value > 11))) {
        alert("Taille invalide");
        renderPlayers();
        return;
    }

    players[i][field] = value;
    savePlayers();
}

// ============================
// ACTIONS JOUEURS
// ============================

function addPlayer() {

    const sex = document.querySelector('input[name="sex"]:checked').value;

    const p = {
        name: document.getElementById("newName").value.trim(),
        sex,
        passe: +document.getElementById("newP").value || 0,
        centre: +document.getElementById("newC").value || 0,
        attaque: +document.getElementById("newA").value || 0,
        tech: +document.getElementById("newT").value || 0,
        ft: +document.getElementById("newFt").value || 0,
        inch: +document.getElementById("newIn").value || 0,
        present: true
    };

    if (!p.name) {
        alert("Nom requis");
        return;
    }

    players.push(p);
    savePlayers();
    renderPlayers();
    clearInputs();

    // UX : refermer le formulaire
    toggleNewPlayer();
}

function clearInputs() {
    ["newName","newP","newC","newA","newT"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

function togglePresent(i) {
    players[i].present = !players[i].present;
    savePlayers();
    renderPlayers();
}

function deletePlayer(i) {
    players.splice(i, 1);
    savePlayers();
    renderPlayers();
}

// ============================
// RENDER TABLE
// ============================

function renderPlayers() {

    const tbody = document.querySelector("#playersTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    players.forEach((p, i) => {

        const disabled = editMode ? "" : "disabled";

        tbody.innerHTML += `
        <tr>
            <td><input type="checkbox" ${p.present?"checked":""} onchange="togglePresent(${i})"></td>

            <td>${editMode
                ? `<input value="${p.name}" onchange="updatePlayer(${i}, 'name', this.value)">`
                : `<div class="cell-text">${p.name}</div>`}</td>

            <td>${editMode
                ? `<select onchange="updatePlayer(${i}, 'sex', this.value)">
                    <option value="M" ${p.sex==="M"?"selected":""}>H</option>
                    <option value="F" ${p.sex==="F"?"selected":""}>F</option>
                   </select>`
                : `<div class="cell-text">${p.sex==="M"?"🚹":"🚺"}</div>`}</td>

            <td>${editMode
                ? `<div class="height-cell">
                        <select onchange="updateHeight(${i}, 'ft', this.value)">
                            ${generateOptions(4,7,p.ft,"'")}
                        </select>
                        <select onchange="updateHeight(${i}, 'inch', this.value)">
                            ${generateOptions(0,11,p.inch,'"')}
                        </select>
                   </div>`
                : `<div class="height-text">${p.ft}'${p.inch}"</div>`}</td>

            <td>${editMode
                ? `<input type="number" value="${p.passe}" min="0" max="10" onchange="updatePlayer(${i}, 'passe', this.value)">`
                : (p.passe>0?"✅":"❌")}</td>

            <td>${editMode
                ? `<input type="number" value="${p.centre}" min="0" max="10" onchange="updatePlayer(${i}, 'centre', this.value)">`
                : (p.centre>0?"✅":"❌")}</td>

            <td>${editMode
                ? `<input type="number" value="${p.attaque}" min="0" max="10" onchange="updatePlayer(${i}, 'attaque', this.value)">`
                : (p.attaque>0?"✅":"❌")}</td>

            <td>${editMode
                ? `<input type="number" value="${p.tech}" min="0" max="10" onchange="updatePlayer(${i}, 'tech', this.value)">`
                : (p.tech>0?"✅":"❌")}</td>

            <td><button onclick="deletePlayer(${i})" ${disabled}>X</button></td>
        </tr>`;
    });

    const t = computeTotals();
    const v = validateTotals(t);

    const cls = ok => ok ? "ok" : "ko";

    tbody.innerHTML += `
    <tr class="totals-row">
        <td class="${cls(v.players)}">${t.present}</td>
        <td>Total</td>
        <td>${t.hommes}H / ${t.femmes}F</td>
        <td>-</td>
        <td class="${cls(v.passe)}">${t.passe}</td>
        <td class="${cls(v.centre)}">${t.centre}</td>
        <td class="${cls(v.attaque)}">${t.attaque}</td>
        <td class="${cls(v.tech)}">${t.tech}</td>
        <td></td>
    </tr>`;
}

// ============================ 
// GENERATION EQUIPES 
// ============================ 
async function generate() { 

    const t = computeTotals(); 
    const v = validateTotals(t); 
    
    let errors = []; if (!v.players) errors.push("Minimum 12 joueurs"); 
    
    if (!v.passe) errors.push("Minimum 2 passeurs"); 
    if (!v.centre) errors.push("Minimum 4 centres"); 
    if (!v.attaque) errors.push("Minimum 4 attaquants"); 
    if (!v.tech) errors.push("Minimum 2 techniques"); 

    if (errors.length > 0) { 
        document.getElementById("result").innerHTML = `
            <div class="team" style="color:red;">
                ${errors.join("<br>")}
            </div>
        `; 
        return; 
    }
    
    const selected = players.filter(p => p.present); 
    
    shuffle(selected); 
    const chosen = selected.slice(0, 12); 
    
    try { 
        const res = await fetch("https://volleyball-backend-vegb.onrender.com/generate", { 
            method: "POST", 
            headers: {"Content-Type": "application/json"}, 
            body: JSON.stringify({ players: chosen }) 
        }); 
        
        const data = await res.json(); 
        displayResult(data); 

    } catch (err) { 
        document.getElementById("result").innerHTML = 
            "<div class='team'>Erreur serveur</div>"; 
    } 
    
} 

// ============================ 
// AFFICHAGE RESULTAT 
// ============================ 

function displayResult(data) { 
    
    if (!data || data.error) { 
        document.getElementById("result").innerHTML = `
            <div class="team">
                ${data?.error || "Aucun résultat"}
            </div>
        `; 
        return; 
    } 
        
    const t1 = data.team1; 
    const t2 = data.team2; 
    
    if (!t1 || !t2) { 
        document.getElementById("result").innerHTML = 
            "<div class='team'>Format invalide serveur</div>"; 
        return; 
    } 
    
    let html = "";

    html += `
    <button onclick='saveMatch(${JSON.stringify(data).replace(/'/g, "&#39;")})' " id='saveMatchBtn'>
        Enregistrer le match
    </button>
    `;

    html += `
    <table class="teams-table"> 
        <thead> 
            <tr> 
                <th>Poste</th> 
                <th>Équipe 1</th> 
                <th>Équipe 2</th> 
            </tr> 
        </thead> 
    
    <tbody> 
        <tr><td>Passeur</td><td>${data.team1.passeur}</td><td>${data.team2.passeur}</td></tr> 
        <tr><td>Centre 1</td><td>${data.team1.centre1}</td><td>${data.team2.centre1}</td></tr> 
        <tr><td>Centre 2</td><td>${data.team1.centre2}</td><td>${data.team2.centre2}</td></tr> 
        <tr><td>Attaque 1</td><td>${data.team1.attaque1}</td><td>${data.team2.attaque1}</td></tr> 
        <tr><td>Attaque 2</td><td>${data.team1.attaque2}</td><td>${data.team2.attaque2}</td></tr> 
        <tr><td>Technique</td><td>${data.team1.tech}</td><td>${data.team2.tech}</td></tr> 
        
        <tr class="score-row"> 
            <td>Score</td> 
            <td>${data.score.team1}</td> 
            <td>${data.score.team2}</td> 
        </tr> 
        
        <tr class="score-row"> 
            <td>Taille moyenne</td> 
            <td>${formatHeight(data.avg_height.team1)}</td> 
            <td>${formatHeight(data.avg_height.team2)}</td> 
        </tr> 
    </tbody> 
    </table> 
    `;

document.getElementById("result").innerHTML = html; 
} 

// ============================ 
// SAVE MATCH 
// ============================ 

function saveMatch(data) {

    const match = {
        id: Date.now(),
        date: new Date().toISOString(),
        team1: data.team1,
        team2: data.team2,
        sets: [
            { t1: 0, t2: 0 },
            { t1: 0, t2: 0 },
            { t1: 0, t2: 0 }
        ],
        locked: false
    };

    const matches = getMatches();
    matches.push(match);
    setMatches(matches);

    alert("Match sauvegardé !");
}

// ============================
// UPDATE SET SCORE — BUG CORRIGÉ
// Toujours lire/écrire via getMatches/setMatches
// ============================

function updateSet(matchId, setIndex, team, value) {

    const matches = getMatches();  // FIX: lire depuis localStorage
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    if (match.locked) {
        alert("Match verrouillé 🔒");
        return;
    }

    if (!match.sets[setIndex]) return;
    match.sets[setIndex][team] = Number(value);

    setMatches(matches);  // FIX: sauvegarder via setMatches
}

// ============================ 
// HISTORY MATCH — BUG CORRIGÉ
// Affichage des équipes + sets + winner
// ============================ 

function renderHistory() {

    const container = document.getElementById("historyContent");
    if (!container) return;

    const matches = getMatches();

    container.innerHTML = "";

    if (matches.length === 0) {
        container.innerHTML = "<p>Aucun match enregistré</p>";
        return;
    }

    const sorted = [...matches].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    // regrouper par date (YYYY-MM-DD)
    const grouped = {};

    sorted.forEach(m => {
        const day = m.date.split("T")[0];
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(m);
    });

    let html = "";

    Object.entries(grouped).forEach(([day, matchesOfDay]) => {

        matchesOfDay.forEach((m, index) => {

            const matchId = m.id;

            const matchNumber = matchesOfDay.length > 1
                ? `Match #${matchesOfDay.length - index}`
                : `Match #1`;

            // Calculer les sets gagnés
            let setsT1 = 0, setsT2 = 0;
            let pointsT1 = 0, pointsT2 = 0;

            (m.sets || []).forEach(s => {
                // comptage des sets
                if (s.t1 > s.t2) setsT1++;
                else if (s.t2 > s.t1) setsT2++;

                // comptage des points
                pointsT1 += Number(s.t1) || 0;
                pointsT2 += Number(s.t2) || 0;
            });

            // 1) priorité aux sets
            let winnerTeam = null;

            if (setsT1 > setsT2) {
                winnerTeam = "team1";
            } 
            else if (setsT2 > setsT1) {
                winnerTeam = "team2";
            } 
            // 2) départage par points si égalité en sets
            else {
                if (pointsT1 > pointsT2) winnerTeam = "team1";
                else if (pointsT2 > pointsT1) winnerTeam = "team2";
            }

            // Construire les lignes des joueurs pour chaque équipe
            const teamKeys = ["passeur","centre1","centre2","attaque1","attaque2","tech"];
            const teamLabels = ["Passeur","Centre 1","Centre 2","Attaque 1","Attaque 2","Technique"];

            let teamRows = teamKeys.map((k, idx) => `
                <tr>
                    <td>${teamLabels[idx]}</td>
                    <td class="${winnerTeam === 'team1' ? 'team-win' : ''}">
                        ${m.locked
                            ? (m.team1?.[k] || "-")
                            : `<select onchange="updateMatchPlayer(${matchId}, 'team1', '${k}', this.value)">
                                <option value="">-- Choisir --</option>
                                ${generatePlayerOptions(m.team1?.[k])}
                            </select>`
                        }
                    </td>

                    <td class="${winnerTeam === 'team2' ? 'team-win' : ''}">
                        ${m.locked
                            ? (m.team2?.[k] || "-")
                            : `<select onchange="updateMatchPlayer(${matchId}, 'team2', '${k}', this.value)">
                                <option value="">-- Choisir --</option>
                                ${generatePlayerOptions(m.team2?.[k])}
                            </select>`
                        }
                    </td>
                </tr>
            `).join("");

            // Construire les lignes des sets
            let setRows = (m.sets || []).map((s, idx) => {

                const t1Win = s.t1 > s.t2;
                const t2Win = s.t2 > s.t1;

                const cellT1Class = [
                    t1Win ? "set-win" : "",
                    winnerTeam === "team1" ? "team-win" : ""
                ].join(" ");

                const cellT2Class = [
                    t2Win ? "set-win" : "",
                    winnerTeam === "team2" ? "team-win" : ""
                ].join(" ");

                if (m.locked) {
                    return `
                    <tr>
                        <td>Set ${idx + 1}</td>
                        <td class="${cellT1Class}">${s.t1}</td>
                        <td class="${cellT2Class}">${s.t2}</td>
                    </tr>`;
                } else {
                    return `
                    <tr>
                        <td>Set ${idx + 1}</td>
                        <td class="${cellT1Class}">
                            <input type="number" value="${s.t1}"
                                onchange="updateSet(${matchId}, ${idx}, 't1', this.value)">
                        </td>
                        <td class="${cellT2Class}">
                            <input type="number" value="${s.t2}"
                                onchange="updateSet(${matchId}, ${idx}, 't2', this.value)">
                        </td>
                    </tr>`;
                }

            }).join("");

            html += `
            <div class="match-card">

                <div class="match-header">
                    <h3>
                        ${m.locked
                            ? formatDate(m.date)
                            : `<input type="date" value="${m.date.split("T")[0]}"
                                onchange="updateMatchDate(${matchId}, this.value)">`
                        }
                        <br>
                        <small>${matchNumber}</small>
                    </h3>

                    ${!m.locked
                        ? `<button class="lock-btn" data-id="${matchId}">✅ Déverrouiller</button>`
                        : `<button class="unlock-btn" data-id="${matchId}">🔓 Verouiller</button>`
                    }

                    ${!m.locked
                        ? `<button class="delete-btn" data-id="${matchId}">❌</button>`
                        : `<button disabled style="opacity:0.3;">🔒</button>`
                    }
                </div>

                <table class="teams-table">
                    <thead>
                        <tr>
                            <th>Poste</th>
                            <th class="${winnerTeam === 'team1' ? 'team-win' : ''}">
                                Équipe 1 ${winnerTeam === 'team1' ? '🏆' : ''} ${!winnerTeam ? '🤝' : ''}
                            </th>

                            <th class="${winnerTeam === 'team2' ? 'team-win' : ''}">
                                Équipe 2 ${winnerTeam === 'team2' ? '🏆' : ''} ${!winnerTeam ? '🤝' : ''}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teamRows}
                        ${setRows}
                    </tbody>
                </table>

            </div>`;
        });

        container.innerHTML = html;
    });
}

function lockMatch(id) {

    const matches = getMatches();
    const match = matches.find(m => m.id === id);
    if (!match) return;

    match.locked = true;
    setMatches(matches);

    renderHistory();
}

function unlockMatch(id) {
    const code = prompt("Code requis :");

    if (code !== "4419") {
        alert("Code invalide");
        return;
    }

    const matches = getMatches();  // FIX: lire depuis localStorage
    const match = matches.find(m => m.id === id);
    if (!match) return;

    match.locked = false;
    setMatches(matches);  // FIX: sauvegarder via setMatches

    renderHistory();
}

function generatePlayerOptions(selectedName) {

    return players.map(p => `
        <option value="${p.name}" ${p.name === selectedName ? "selected" : ""}>
            ${p.name}
        </option>
    `).join("");
}

function updateMatchDate(matchId, newDate) {

    const matches = getMatches();
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    if (match.locked) {
        alert("Match verrouillé 🔒");
        return;
    }

    // garder format ISO complet
    const old = new Date(match.date);
    const updated = new Date(newDate);

    // conserver l'heure originale
    updated.setHours(old.getHours(), old.getMinutes(), old.getSeconds());

    match.date = updated.toISOString();

    setMatches(matches);
    renderHistory();
}

function updateMatchPlayer(matchId, team, role, value) {

    const matches = getMatches();
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    if (match.locked) {
        alert("Match verrouillé 🔒");
        return;
    }

    // empêcher doublons dans un même match
    const allPlayers = Object.values(match.team1).concat(Object.values(match.team2));

    if (value && allPlayers.includes(value)) {
        alert("Ce joueur est déjà dans le match !");
        renderHistory();
        return;
    }

    match[team][role] = value;

    setMatches(matches);
}

function deleteMatch(id) {

    let matches = getMatches();
    const match = matches.find(m => m.id === id);

    if (match?.locked) {
        alert("Impossible de supprimer un match verrouillé 🔒");
        return;
    }

    matches = matches.filter(m => m.id !== id);
    setMatches(matches);

    renderHistory();
}

document.addEventListener("click", function (e) {

    const deleteBtn = e.target.closest(".delete-btn");
    if (deleteBtn) {
        const id = Number(deleteBtn.dataset.id);
        deleteMatch(id);
        return;
    }

    const lockBtn = e.target.closest(".lock-btn");
    if (lockBtn) {
        const id = Number(lockBtn.dataset.id);
        lockMatch(id);
        return;
    }

    const unlockBtn = e.target.closest(".unlock-btn");
    if (unlockBtn) {
        const id = Number(unlockBtn.dataset.id);
        unlockMatch(id);
        return;
    }
});

// ============================ 
// STATS — BUG CORRIGÉ
// Calcul basé sur les sets, pas sur score1/score2 inexistants
// ============================ 

function computeStats() {

    const matches = getMatches();
    let stats = {};

    matches.forEach(m => {

        let setsT1 = 0, setsT2 = 0;
        let pointsT1 = 0, pointsT2 = 0;
        let setsPlayedT1 = 0;
        let setsPlayedT2 = 0;

        (m.sets || []).forEach(s => {

            // ignorer set non joué
            if ((s.t1 === 0 && s.t2 === 0) || s.t1 == null || s.t2 == null) {
                return;
             }

            // compter sets gagnés
            if (s.t1 > s.t2) setsT1++;
            else if (s.t2 > s.t1) setsT2++;

            // compter sets joués (valides seulement)
            if (!(s.t1 === 0 && s.t2 === 0)) {
                setsPlayedT1++;
                setsPlayedT2++;
            }

            // cumuler les points
            pointsT1 += Number(s.t1 || 0);
            pointsT2 += Number(s.t2 || 0);
        });

        const teamKeys = ["passeur","centre1","centre2","attaque1","attaque2","tech"];

        teamKeys.forEach(k => {

            const name1 = m.team1?.[k];
            const name2 = m.team2?.[k];

            // ÉQUIPE 1
            if (name1) {
                if (!stats[name1]) stats[name1] = initStat();

                stats[name1].games++;
                stats[name1].setsWon += setsT1;
                stats[name1].setsPlayed += setsPlayedT1;
                stats[name1].points += pointsT1;

                if (setsT1 > setsT2) stats[name1].wins++;
            }

            // ÉQUIPE 2
            if (name2) {
                if (!stats[name2]) stats[name2] = initStat();

                stats[name2].games++;
                stats[name2].setsWon += setsT2;
                stats[name2].setsPlayed += setsPlayedT2;
                stats[name2].points += pointsT2;

                if (setsT2 > setsT1) stats[name2].wins++;
            }

        });

    });

    return stats;
}

function initStat() {
    return {
        games: 0,
        wins: 0,
        setsWon: 0,
        setsPlayed: 0,
        points: 0
    };
}

function sortStats(key) {

    if (!key) return; // sécurité

    if (statsSort.key === key) {
        statsSort.asc = !statsSort.asc;
    } else {
        statsSort.key = key;
        statsSort.asc = false;
    }

    renderStats();
}

function resetStatsSort() {
    statsSort = {
        key: "setsPct",
        asc: false
    };
    renderStats();
}

function sortIcon(key) {
    if (statsSort.key !== key) return "";
    return statsSort.asc ? " ↑" : " ↓";
}

function renderStats() {

    const container = document.getElementById("statsContent");
    if (!container) return;

    const stats = computeStats();
    const entries = Object.entries(stats);

    if (entries.length === 0) {
        container.innerHTML = "<p>Aucune statistique disponible. Sauvegardez des matchs d'abord.</p>";
        return;
    }

    // Trier par % de victoires décroissant
    entries.sort((a, b) => {

        const A = a[1];
        const B = b[1];

        const getValue = (s, key) => {

            switch (key) {
                case "games": return s.games;
                case "wins": return s.wins;
                case "setsWon": return s.setsWon;
                case "points": return s.points;

                case "winPct":
                    return s.games ? s.wins / s.games : 0;

                case "setsPct":
                    return s.setsPlayed ? s.setsWon / s.setsPlayed : 0;

                case "ptsPerSet":
                    return s.setsPlayed ? s.points / s.setsPlayed : 0;

                default:
                    return 0;
            }
        };

        const valA = getValue(A, statsSort.key);
        const valB = getValue(B, statsSort.key);

        return statsSort.asc ? valA - valB : valB - valA;
    });

    let html = `
    <div class="match-card">

    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <strong>Classement joueurs</strong>
        <button onclick="resetStatsSort()" class="reset-btn">↺ Reset</button>
    </div>

    <table class="teams-table">
        <thead>
            <tr class="score-row">
                <th class="no-sort">#</th>
                <th class="no-sort">Joueur</th>
                <th onclick="sortStats('wins')">Victoires ${sortIcon('wins')}</th>
                <th onclick="sortStats('winPct')">% ${sortIcon('winPct')}</th>
                <th onclick="sortStats('setsWon')">Sets ${sortIcon('setsWon')}</th>
                <th onclick="sortStats('setsPct')">% Sets ${sortIcon('setsPct')}</th>
                <th onclick="sortStats('ptsPerSet')">Pts / Set ${sortIcon('ptsPerSet')}</th>
            </tr>
        </thead>
        <tbody>`;

    entries.forEach(([name, s], idx) => {

        const isTop = idx === 0 ? " 🏆" : "";

        const pct = s.games ? ((s.wins / s.games) * 100).toFixed(0) : 0;

        const setPct = s.setsPlayed
            ? ((s.setsWon / s.setsPlayed) * 100).toFixed(0)
            : 0;

        const ptsPerSet = s.setsPlayed
            ? (s.points / s.setsPlayed).toFixed(1)
            : 0;

        html += `
        <tr>
            <td>${idx + 1}</td>
            <td>${name}${isTop}</td>
            <td>${s.wins}</td>
            <td>${pct}% (${s.wins}/${s.games})</td>
            <td>${s.setsWon}</td>
            <td>${setPct}% (${s.setsWon}/${s.setsPlayed})</td>
            <td>${ptsPerSet}</td>
        </tr>`;
    });

    html += "</tbody></table>";

    container.innerHTML = html;
}

// ============================ 
// INIT 
// ============================ 

renderPlayers();