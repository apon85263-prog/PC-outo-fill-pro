(() => {
  // Prevent duplicate listeners if the user clicks Fill more than once on this tab.
  if (window.__pccPassportAutofillInstalled) return;
  window.__pccPassportAutofillInstalled = true;

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type !== "fill") return;

    const data = msg.data || {};
    const aliases = {
      name: ["full name", "applicant name", "name"],
      passportNumber: ["passport number", "passport no", "passport"],
      dateOfBirth: ["date of birth", "birth date", "dob"],
      nationality: ["nationality"],
      fatherName: ["father name", "father"],
      motherName: ["mother name", "mother"],
      address: ["present address", "permanent address", "address"]
    };

    for (const [key, words] of Object.entries(aliases)) {
      if (!data[key]) continue;
      const field = findField(words);
      if (!field) continue;
      if (!setFieldValue(field, data[key])) continue;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function findField(aliases) {
    const fields = [...document.querySelectorAll("input, textarea, select")]
      .filter((field) => !field.disabled && field.type !== "hidden");

    return fields.find((field) => {
      const labelText = field.labels ? [...field.labels].map((label) => label.innerText).join(" ") : "";
      const haystack = normalize([
        field.name,
        field.id,
        field.placeholder,
        field.getAttribute("aria-label"),
        field.getAttribute("autocomplete"),
        labelText
      ].join(" "));
      return aliases.some((alias) => haystack.includes(normalize(alias)));
    });
  }

  function setFieldValue(field, value) {
    const text = String(value);
    if (field instanceof HTMLSelectElement) {
      const option = [...field.options].find((item) =>
        normalize(item.value) === normalize(text) || normalize(item.textContent) === normalize(text)
      );
      if (!option) return false;
      field.value = option.value;
      return true;
    }

    const prototype = field instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(field, text);
    else field.value = text;
    return true;
  }
})();
