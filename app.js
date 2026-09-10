(function () {
  "use strict";

  var headingEl = document.getElementById("form-heading");
  var subheadingEl = document.getElementById("form-subheading");
  var submitBtn = document.getElementById("submit-btn");
  var formSection = document.querySelector(".form-section");
  var resultSection = document.getElementById("result");
  var registrationForm = document.getElementById("registration-form");
  var formError = document.getElementById("form-error");
  var step1 = document.getElementById("step-1");
  var step2 = document.getElementById("step-2");
  var step1Error = document.getElementById("step1-error");
  var stepIndicator = document.getElementById("step-indicator");
  var nextBtn = document.getElementById("next-btn");
  var backBtn = document.getElementById("back-btn");

  function setHeadingState(full) {
    if (full) {
      headingEl.textContent = "SESSION COMPLETE";
      subheadingEl.textContent = "Les places sont prises, mais tu peux rejoindre la liste d'attente.";
      subheadingEl.hidden = false;
      submitBtn.textContent = "REJOINDRE LA LISTE D'ATTENTE";
    } else {
      headingEl.textContent = "REJOINS LA SESSION";
      subheadingEl.hidden = true;
      submitBtn.textContent = "CONFIRMER MA PARTICIPATION";
    }
  }

  function loadStatus() {
    // La jauge n'est plus affichee publiquement : cet appel sert uniquement
    // a determiner si le formulaire doit basculer en mode liste d'attente.
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

  function goToStep2() {
    var inputs = step1.querySelectorAll("input[required]");
    var valid = true;
    inputs.forEach(function (input) {
      if (!input.reportValidity()) valid = false;
    });
    if (!valid) return;
    hideError(step1Error);
    step1.hidden = true;
    step2.hidden = false;
    stepIndicator.textContent = "ETAPE 2 / 2";
  }

  function goToStep1() {
    step2.hidden = true;
    step1.hidden = false;
    stepIndicator.textContent = "ETAPE 1 / 2";
  }

  nextBtn.addEventListener("click", goToStep2);
  backBtn.addEventListener("click", goToStep1);

  function renderResult(status, whatsappLink) {
    formSection.hidden = true;
    resultSection.hidden = false;

    if (status === "CONFIRME") {
      var whatsappBlock = whatsappLink
        ? '<a class="whatsapp-cta" href="' + whatsappLink + '" target="_blank" rel="noopener">REJOINDRE LE GROUPE WHATSAPP</a>'
        : '<p class="result-text">Le lien du groupe WhatsApp sera communique prochainement.</p>';

      resultSection.innerHTML =
        '<h2 class="result-title">TA PLACE EST PRE-VALIDEE.</h2>' +
        '<p class="result-text">Derniere etape : rejoins le QG du Sanction Club pour recevoir le lieu, l\'heure et toutes les informations.</p>' +
        whatsappBlock +
        '<p class="result-note">L\'inscription au site ne garantit pas l\'acces automatique au groupe WhatsApp, l\'approbation y est manuelle.</p>';
      return;
    }

    resultSection.innerHTML =
      '<h2 class="result-title result-title--accent">TU ES SUR LISTE D\'ATTENTE.</h2>' +
      '<p class="result-text">Les places confirmees sont prises. On te recontacte des qu\'une place se libere.</p>';
  }

  registrationForm.addEventListener("submit", function (event) {
    event.preventDefault();
    hideError(formError);

    var step2Inputs = step2.querySelectorAll("input[required]");
    var valid = true;
    step2Inputs.forEach(function (input) {
      if (!input.reportValidity()) valid = false;
    });
    if (!valid) return;

    var formData = new FormData(registrationForm);
    var payload = {
      type: "participant",
      prenom: formData.get("prenom"),
      nom: formData.get("nom"),
      instagram: formData.get("instagram"),
      email: formData.get("email"),
      telephone: formData.get("telephone"),
      participate: formData.get("participate") === "on",
      consentementImage: formData.get("consentement_image") === "on",
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
          showError(formError, result.data.message || "Tu es deja inscrit au Sanction Club.");
          submitBtn.disabled = false;
          return;
        }
        if (!result.ok) {
          showError(formError, result.data.error || "Une erreur est survenue, reessaie.");
          submitBtn.disabled = false;
          return;
        }
        renderResult(result.data.status, result.data.whatsappLink);
      })
      .catch(function () {
        showError(formError, "Une erreur est survenue, reessaie.");
        submitBtn.disabled = false;
      });
  });

  loadStatus();
})();
