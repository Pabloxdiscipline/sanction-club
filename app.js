(function () {
  "use strict";

  var headingEl = document.getElementById("form-heading");
  var subheadingEl = document.getElementById("form-subheading");
  var submitBtn = document.getElementById("submit-btn");
  var formSection = document.querySelector(".form-section");
  var resultSection = document.getElementById("result");
  var registrationForm = document.getElementById("registration-form");
  var formError = document.getElementById("form-error");

  function setHeadingState(full) {
    if (full) {
      headingEl.textContent = "SESSION COMPLÈTE";
      subheadingEl.textContent = "Les places sont prises, mais tu peux rejoindre la liste d'attente.";
      subheadingEl.hidden = false;
      submitBtn.textContent = "REJOINS LA FILE D'ATTENTE";
    } else {
      headingEl.textContent = "REJOINS LA SESSION";
      subheadingEl.hidden = true;
      submitBtn.textContent = "REJOINS LA SANCTION";
    }
  }

  function loadStatus() {
    // La jauge n'est plus affichée publiquement : cet appel sert uniquement
    // à déterminer si le formulaire doit basculer en mode liste d'attente.
    fetch("/api/status")
      .then(function (res) {
        if (!res.ok) throw new Error("status_failed");
        return res.json();
      })
      .then(function (data) {
        setHeadingState(Boolean(data.full));
      })
      .catch(function () {
        setHeadingState(false);
      });
  }

  function showError(el, message) {
    el.textContent = message;
    el.hidden = false;
  }

  function hideError(el) {
    el.hidden = true;
  }

  function renderResult(status) {
    formSection.hidden = true;
    resultSection.hidden = false;

    if (status === "CONFIRME") {
      resultSection.innerHTML =
        '<h2 class="result-title">TA PLACE EST CONFIRMÉE.</h2>' +
        '<p class="result-text">Je vais t\'ajouter moi-même au groupe WhatsApp du Sanction Club dans les prochaines heures.</p>' +
        '<p class="result-text">Garde un œil sur tes notifications.</p>';
      return;
    }

    resultSection.innerHTML =
      '<h2 class="result-title result-title--accent">TU ES SUR LISTE D\'ATTENTE.</h2>' +
      '<p class="result-text">On te recontacte si une place se libère.</p>';
  }

  registrationForm.addEventListener("submit", function (event) {
    event.preventDefault();
    hideError(formError);

    var formData = new FormData(registrationForm);
    var payload = {
      type: "participant",
      prenom: formData.get("prenom"),
      nom: formData.get("nom"),
      instagram: formData.get("instagram"),
      email: formData.get("email"),
      telephone: formData.get("telephone"),
      // Plus de checkboxes dans le formulaire : soumettre vaut confirmation
      // de participation. Le consentement image reste à sa valeur par
      // défaut (false) en base, personne ne peut plus le cocher.
      participate: true,
      consentementImage: false,
    };

    submitBtn.disabled = true;

    fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function (result) {
        if (result.data.status === "DUPLICATE") {
          showError(formError, result.data.message || "Tu es déjà inscrit au Sanction Club.");
          submitBtn.disabled = false;
          return;
        }
        if (!result.ok) {
          showError(formError, result.data.error || "Une erreur est survenue, réessaie.");
          submitBtn.disabled = false;
          return;
        }
        renderResult(result.data.status);
      })
      .catch(function () {
        showError(formError, "Une erreur est survenue, réessaie.");
        submitBtn.disabled = false;
      });
  });

  loadStatus();
})();
