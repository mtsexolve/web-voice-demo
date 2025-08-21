import { action, computed, deepMap } from "nanostores";
import { Communicator } from "@exolve/web-voice-sdk";
import { notificationService } from "@hope-ui/solid";
import { tryRegisterAccount, unregister } from "./communicator.ts";
import { environments } from "@environments";

const STORAGE_KEY = "settings";

export enum Environment {
	TEST,
	PRE_PRODUCTION,
	PRODUCTION,
}

export type Settings = {
	sipUserName: string;
	sipPassword: string;
	environment: Environment;
};


function getPersistentSettings(): Settings {
	const savedValue = localStorage.getItem(STORAGE_KEY);

	if (!savedValue) return {} as never;
	return JSON.parse(savedValue) as Settings;
}

export const $settings = deepMap<Settings>(getPersistentSettings());

export const setupSettings = action($settings, "setupActions", async (store, settings: Settings) => {
	
	const communicator = new Communicator();

	if( Object.keys(environments).length > 0 ) {
		//@ts-ignore
		const environment = environments[settings.environment];
		communicator.initialize({
			...environment,
		});
	} else {
		communicator.initialize();
	}
	
	tryRegisterAccount(communicator, settings.sipUserName, settings.sipPassword).then(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
		store.set(settings);
	}).catch((error) => {
		notificationService.show({status: "danger", title: "Ошибка", description: "Данные некорректны или сервер недоступен"});
		console.log(error);
	});
});

export const resetSettings = action($settings, "resetSettings", store => {

	const communicator = new Communicator();

	if(communicator.client.isRegistered()) {
		unregister().then(() => {
			localStorage.removeItem(STORAGE_KEY);
			store.set({} as never);
		});
	} else {
		localStorage.removeItem(STORAGE_KEY);
		store.set({} as never);
	}
});


export const $settingsReady = computed($settings, settings => Object.keys(settings).length > 0);
