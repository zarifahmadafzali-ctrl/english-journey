import test from "node:test";
import assert from "node:assert/strict";

// Pure helpers mirrored from tts.js language mapping
function mapLang(lang) {
  if (!lang) return "en-US";
  const l = String(lang).toLowerCase().replace("_", "-");
  if (l === "fa" || l.startsWith("fa-") || l === "persian" || l === "farsi") {
    return "fa-IR";
  }
  if (l === "en" || l.startsWith("en-")) {
    return "en-US";
  }
  return l.startsWith("fa") ? "fa-IR" : "en-US";
}

test("mapLang en variants", () => {
  assert.equal(mapLang("en"), "en-US");
  assert.equal(mapLang("en-US"), "en-US");
  assert.equal(mapLang("en_US"), "en-US");
});

test("mapLang fa variants", () => {
  assert.equal(mapLang("fa"), "fa-IR");
  assert.equal(mapLang("fa-IR"), "fa-IR");
  assert.equal(mapLang("fa_IR"), "fa-IR");
  assert.equal(mapLang("persian"), "fa-IR");
});

test("mapLang default", () => {
  assert.equal(mapLang(undefined), "en-US");
  assert.equal(mapLang(""), "en-US");
});
