import { action, map, onMount } from "nanostores";
import { Communicator, RegistrationEvent } from "@exolve/web-voice-sdk";
import { $settings } from "./settings.ts";
import ringtoneUrl from "../assets/ringtone.mp3";
import { environments  } from "@environments";
import { notificationService } from "@hope-ui/solid";

type SDKStore = {
	instance: Communicator;
	registered: boolean;
};

export const $communicator = map<SDKStore>({
	instance: new Communicator(),
	registered: false,
});

export async function tryRegisterAccount(communicator: Communicator, username: string, password: string): Promise<any> {
	let promise = new Promise((resolve, reject) => {
	const timeout = setTimeout(() => reject("activation timeout"), 2000);
		communicator.client.on(RegistrationEvent.Registered, () => {	
			$communicator.setKey("registered", true);
			clearTimeout(timeout);
			resolve(true);
		});

		communicator.client.on(RegistrationEvent.Error, (error) => {
			console.error("tryRegisterAccount registrarion error:"+JSON.stringify(error));
			$communicator.setKey("registered", false);
			communicator.client.unregisterAccount();
			clearTimeout(timeout);
			reject("registration error");
		});

	});
	communicator.client.registerAccount(username, password);
	return await promise;
};

async function internalUnregisterAccount(communicator: Communicator): Promise<any> {
	let promise = new Promise((resolve, reject) => {
	const timeout = setTimeout(() => reject("deactivation timeout"), 2000);
		communicator.client.on(RegistrationEvent.NotRegistered, () => {	
			$communicator.setKey("registered", false);
			clearTimeout(timeout);
			resolve(true);
		});
		communicator.client.on(RegistrationEvent.Error, () => {
			$communicator.setKey("registered", false);
			clearTimeout(timeout);
			reject("registration error");
		});
	});
	communicator.client.unregisterAccount();
	return await promise;
};


export const register = action($communicator, "register", async store => {
	const settings = $settings.get();
	const { instance } = store.get();
	tryRegisterAccount(instance, settings.sipUserName, settings.sipPassword).catch(error => {
		notificationService.show({
			title: "Ошибка регистрации",
			status: "danger",
			description: "Проверьте корректность авторизационных данных",
		});
		console.log("error on registration", error);
	});
});

export const unregister = action($communicator, "unRegister", async store => {
	const { instance } = store.get();
	internalUnregisterAccount(instance).catch(error => {
		notificationService.show({
			status: "danger",
			description: "Ошибка снятия регистрации",
		});
		console.log("error on unregister", error);
	});
});


onMount($communicator, () => {
	const settings = $settings.get();
	const instance = $communicator.get().instance;
	//@ts-ignore
	const environment = environments[settings.environment];


	instance.initialize({
		...environment,
		debug: true,
		maxLines: 5,
		ringtoneEnabled: true,
		ringtoneSound: ringtoneUrl
	});

	window.addEventListener("unload", async function () {
		instance.client.unregisterAccount();
	});

	return () => {
		instance.client.unregisterAccount();
	};
});
