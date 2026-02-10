import { atom, onSet } from "nanostores";

const TARGET_STORAGE_KEY = "target";

const EXTRA_CONTEXT_STORAGE_KEY = "extraContext";

export const $target = atom(localStorage.getItem(TARGET_STORAGE_KEY) || "");

export const $extraContext = atom(localStorage.getItem(EXTRA_CONTEXT_STORAGE_KEY) || "");

onSet($target, ({ newValue }) => {
	localStorage.setItem(TARGET_STORAGE_KEY, newValue);
});

onSet($extraContext, ({ newValue }) => {
	localStorage.setItem(EXTRA_CONTEXT_STORAGE_KEY, newValue);
});