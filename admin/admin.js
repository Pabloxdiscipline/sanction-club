(function () {
  "use strict";

  var STORAGE_KEY = "sanction_admin_password";
  var ALLOWED_STATUTS = ["CONFIRME", "WAITLIST", "ANNULE", "PRESENT"];

  var gate = document.getElementById("gate");
  var gateForm = document.getElementById("gate-form");
  var gateError = document.getElementById("gate-error");
  var dashboard = document.getElementById("dashboard");
  var statTotal = document.getElementById("stat-total");
  var statConfirmed = document.getElementById("stat-confirmed");
  var statWaitlist = document.getElementById("stat-waitlist");
  var statWhatsapp = document.getElementById("stat-whatsapp");
  var searchInput = document.getElementById("search-input");
  var registrationsBody = document.getElementById("registrations-body");
  var interessesBody = document.getElementById("interesses-body");
  var exportBtn = document.getElementById("export-btn");

  var searchTimer = null;

  function getPassword() {
    return sessionStorage.getItem(STORAGE_KEY) || "";
  }

  function authFetch(url) {
    return fetch(url, { headers: { "X-Admin-Password": getPassword() } });
  }

  function formatDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function statutOptions(current) {
    return ALLOWED_STATUTS.map(function (s) {
      return '<option value="' + s + '"' + (s === current ? " selected" : "") + ">" + s + "</option>";
    }).join("");
  }

  function cellOrDash(value) {
    return value ? escapeHtml(value) : '<span class="cell-empty">-</span>';
  }

  function waLink(phone) {
    var digits = String(phone || "").replace(/\D/g, "");
    return digits ? "https://wa.me/" + digits : null;
  }

  function telephoneCell(r) {
    var link = r.statut === "CONFIRME" ? waLink(r.telephone) : null;
    if (link) {
      return '<a class="wa-link" href="' + link + '" target="_blank" rel="noopener">' + escapeHtml(r.telephone) + "</a>";
    }
    return cellOrDash(r.telephone);
  }

  function whatsappCell(r) {
    if (r.statut !== "CONFIRME") {
      return '<span class="cell-empty">-</span>';
    }
    return (
      '<label class="whatsapp-check">' +
      '<input type="checkbox" class="whatsapp-checkbox" data-id="' + r.id + '"' +
      (r.ajoute_whatsapp ? " checked" : "") +
      "></label>"
    );
  }

  function renderRegistrations(rows) {
    if (rows.length === 0) {
      registrationsBody.innerHTML = '<tr class="empty-row"><td colspan="8">Aucune inscription.</td></tr>';
      return;
    }
    registrationsBody.innerHTML = rows
      .map(function (r) {
        return (
          "<tr data-id=\"" + r.id + "\">" +
          "<td>" + escapeHtml(r.prenom) + "</td>" +
          "<td>" + escapeHtml(r.nom) + "</td>" +
          "<td>" + (r.instagram ? "@" + escapeHtml(r.instagram) : '<span class="cell-empty">-</span>') + "</td>" +
          "<td>" + telephoneCell(r) + "</td>" +
          "<td>" + escapeHtml(r.email) + "</td>" +
          "<td>" + formatDate(r.created_at) + "</td>" +
          '<td><select class="statut-select" data-id="' + r.id + '">' + statutOptions(r.statut) + "</select></td>" +
          "<td>" + whatsappCell(r) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    registrationsBody.querySelectorAll(".statut-select").forEach(function (select) {
      select.addEventListener("change", function () {
        updateRegistration(select.getAttribute("data-id"), { statut: select.value });
      });
    });

    registrationsBody.querySelectorAll(".whatsapp-checkbox").forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        updateRegistration(checkbox.getAttribute("data-id"), { ajoute_whatsapp: checkbox.checked });
      });
    });
  }

  function renderInteresses(rows) {
    if (rows.length === 0) {
      interessesBody.innerHTML = '<tr class="empty-row"><td colspan="6">Aucun intéressé pour le moment.</td></tr>';
      return;
    }
    interessesBody.innerHTML = rows
      .map(function (r) {
        return (
          "<tr>" +
          "<td>" + escapeHtml(r.prenom) + "</td>" +
          "<td>" + escapeHtml(r.nom) + "</td>" +
          "<td>" + (r.instagram ? "@" + escapeHtml(r.instagram) : '<span class="cell-empty">-</span>') + "</td>" +
          "<td>" + cellOrDash(r.telephone) + "</td>" +
          "<td>" + escapeHtml(r.email) + "</td>" +
          "<td>" + formatDate(r.created_at) + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
  }

  function loadParticipants() {
    var q = searchInput.value.trim();
    var url = "/api/admin/registrations?type=participant" + (q ? "&q=" + encodeURIComponent(q) : "");
    return authFetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("unauthorized");
        return res.json();
      })
      .then(function (data) {
        statTotal.textContent = data.stats.total;
        statConfirmed.textContent = data.stats.confirmed;
        statWaitlist.textContent = data.stats.waitlist;
        statWhatsapp.textContent = data.stats.added_whatsapp + " / " + data.stats.confirmed;
        renderRegistrations(data.registrations);
      });
  }

  function loadInteresses() {
    return authFetch("/api/admin/registrations?type=interesse")
      .then(function (res) {
        if (!res.ok) throw new Error("unauthorized");
        return res.json();
      })
      .then(function (data) {
        renderInteresses(data.registrations);
      });
  }

  function updateRegistration(id, patch) {
    var body = Object.assign({ id: Number(id) }, patch);
    fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": getPassword(),
      },
      body: JSON.stringify(body),
    }).then(function (res) {
      if (res.ok) {
        loadParticipants();
      }
    });
  }

  gateForm.addEventListener("submit", function (event) {
    event.preventDefault();
    gateError.hidden = true;
    var password = new FormData(gateForm).get("password");
    sessionStorage.setItem(STORAGE_KEY, password);

    Promise.all([loadParticipants(), loadInteresses()])
      .then(function () {
        gate.hidden = true;
        dashboard.hidden = false;
      })
      .catch(function () {
        sessionStorage.removeItem(STORAGE_KEY);
        gateError.textContent = "Mot de passe incorrect.";
        gateError.hidden = false;
      });
  });

  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadParticipants, 250);
  });

  exportBtn.addEventListener("click", function () {
    authFetch("/api/admin/export")
      .then(function (res) {
        if (!res.ok) throw new Error("export_failed");
        return res.blob();
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "sanction-club-inscriptions.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
  });

  if (getPassword()) {
    Promise.all([loadParticipants(), loadInteresses()])
      .then(function () {
        gate.hidden = true;
        dashboard.hidden = false;
      })
      .catch(function () {
        sessionStorage.removeItem(STORAGE_KEY);
      });
  }
})();
