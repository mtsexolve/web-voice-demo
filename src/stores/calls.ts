import { action, map, onMount } from "nanostores";
import { $communicator } from "./communicator.ts";
import { Call, CallEvent, RegistrationEvent, CallState } from "@exolve/web-voice-sdk";


export type CallItem = {
	state: CallState;
	duration: number;
	call: Call;
	durationUpdater?: NodeJS.Timeout;
};

export const $calls = map<CallItem[]>([]);




onMount($calls, () => {
	const { instance } = $communicator.get();

    instance.client.on(CallEvent.New, (call: Call) => {
		setCall( call );
    });

	instance.client.on(CallEvent.Connected, (call: Call) => {
		const callItem = get(call.id);

		updateKey(call.id, {
			state: call.state,
			durationUpdater:
				callItem.durationUpdater ||
				setInterval(() => updateKey(call.id, { duration: get(call.id).duration + 1 }), 1000),
		});
	});

	instance.client.on(CallEvent.OnHold, (call: Call) => {
		updateKey(call.id, {
			state: call.state,
		});
	});

	instance.client.on(CallEvent.Resumed, (call: Call) => {
		updateKey(call.id, {
			state: call.state,
		});
	});

	instance.client.on(CallEvent.Error, (call: Call) => {
		if(call !== null)
			remove(call.id);
    });

	instance.client.on(CallEvent.Disconnected, (call: Call) => {
		if(call !== null)
			remove(call.id);
    });

	instance.client.on(RegistrationEvent.Error, () => {
		$communicator.setKey("registered", false);
	});

	window.addEventListener("unload", async function () {
		instance.client.removeAllListeners();
	});

	return () => {
		instance.client.removeAllListeners();
	};
});

const setCall = action($calls, "setCall", (_ , call: Call) => {
		const callItem: CallItem = {
			state: call.state,
			duration: 0,
			call: call,
		};

		push(callItem);
	},
);

const get = action($calls, "get", (store, id) => {
	return store.get().find(v => v.call.id === id)!;
});

const remove = action($calls, "remove", (store, id: string) => {
	store.set(
		store.get().filter(v => {
			if (v.call.id !== id) return true;
			clearInterval(v.durationUpdater);
			return false;
		}),
	);
});

const push = action($calls, "push", (store, callItem: CallItem) => {
	store.set([...store.get(), callItem]);
});

const updateKey = action($calls, "updateKey", (store, id: string, callValues: Partial<CallItem>) => {
	store.set(store.get().map(v => (v.call.id === id ? { ...v, ...callValues } : { ...v })));
});
