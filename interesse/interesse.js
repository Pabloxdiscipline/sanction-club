(function () {
  "use strict";

  var formSection = document.querySelector(".form-section");
  var resultSection = document.getElementById("result");
  var form = document.getElementById("interesse-form");
  var formError = document.getElementById("form-error");
  var submitBtn = document.getElementById("submit-btn");

  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  function hideError() {
    formError.hidden = true;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    hideError();

    var formData = new FormData(form);
    var payload = {
      type: "interesse",
      prenom: formData.get("prenom"),
      nom: formData.get("nom"),
      email: formData.get("email"),
      instagram: formData.get("instagram"),
      telephone: formData.get("telephone"),
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
          showError(result.data.message || "Tu es deja inscrit au Sanction Club.");
          submitBtn.disabled = false;
          return;
        }
        if (!result.ok) {
          showError(result.data.error || "Une erreur est survenue, reessaie.");
          submitBtn.disabled = false;
          return;
        }
        formSection.hidden = true;
        resultSection.hidden = false;
        resultSection.innerHTML =
          '<h2 class="result-title">C\'EST NOTE.</h2>' +
          '<p class="result-text">On te previendra des prochaines editions du Sanction Club.</p>' +
          '<p class="secondary-link"><a href="/">Retour a la page principale</a></p>';
      })
      .catch(function () {
        showError("Une erreur est survenue, reessaie.");
        submitBtn.disabled = false;
      });
  });
})();
