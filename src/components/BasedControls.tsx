import { FiPhone } from "solid-icons/fi";
import { $settings, resetSettings } from "../stores/settings.ts";
import { useStore } from "@nanostores/solid";
import { $communicator, register, unregister } from "../stores/communicator.ts";
import { $target } from "../stores/target.ts";
import { environments } from "@environments";
import {
	Badge,
	Box,
	Button,
	Input,
	InputGroup,
	InputLeftElement,
	Select,
	SelectContent,
	SelectIcon,
	SelectListbox,
	SelectOption,
	SelectOptionText,
	SelectTrigger,
	SelectValue,
} from "@hope-ui/solid";
import { For, createSignal, onMount } from "solid-js";
import { AudioDeviceEvent , AudioDevice } from "@exolve/web-voice-sdk";



export function BasedControls() {
	const communicator = useStore($communicator);
	const target = useStore($target);
	const settings = useStore($settings);

	const isSwitchEnv = ( Object.keys(environments).length > 0 );

	const handleToggleRegistration = () => {
		communicator().registered ? unregister() : register();
	};

	const handleStartCall = async () => {
		if (!communicator().registered) register();
		communicator().instance.client.makeCall($target.get());
	};

	const [audioDevices, setAudioDevices] = createSignal<AudioDevice[]>([]);
  	const [loading, setLoading] = createSignal(true);

	const handleSelectAudioDevice = (deviceId: String) => {
		const selectedAudioDevice = audioDevices().find(audioDevice => audioDevice.id === deviceId);
		if ( selectedAudioDevice !== undefined ) {
			communicator().instance.client.setAudioDevice(selectedAudioDevice);
		}
	};


	onMount(async () => {
		const audioDevices = await communicator().instance.client.getAudioDevices();
		setAudioDevices(audioDevices);
		setLoading(false);

		communicator().instance.client.on( AudioDeviceEvent.Changed, (audioDevices: AudioDevice[]) => {
			setAudioDevices(audioDevices);
		});
	});

	return (
		<Box css={{ padding: "16px", borderRadius: "8px", backgroundColor: "$neutral2"}}>
			<Box css={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
				<Button onClick={handleToggleRegistration} size="sm" colorScheme="accent" variant="dashed">
					{communicator().registered ? "Снять регистрацию" : "Регистрация"}
				</Button>

				<Badge colorScheme={communicator().registered ? "success" : "warning"}>
					{communicator().registered ? "Registered" : "UnRegistered"}
				</Badge>
			</Box>

			<Box css={{ "margin-top": "24px" }}>
				<InputGroup>
					<InputLeftElement pointerEvents="none" color="$neutral9">
						<FiPhone />
					</InputLeftElement>
					<Input
						type="tel"
						value={target()}
						onInput={e => $target.set(e.currentTarget.value)}
						placeholder="Номер телефона"
					/>
				</InputGroup>
				<Button
					onClick={handleStartCall}
					colorScheme="accent"
					fullWidth
					css={{ "margin-top": "12px" }}
					size="sm">
					Начать звонок
				</Button>
			</Box>

			<Box css={{ "margin-top": "24px", "font-size": "0.9em", color: "$neutral10" }}>
				Авторизованы как <strong>{settings().sipUserName}</strong>
				{isSwitchEnv && (
					<>
						<br/>
						Среда: <strong>{ 
						//@ts-ignore
						settings().environment in environments ? environments[settings().environment].name : ""
						}</strong>
					</>
				)}
				<br />
					<Box css={{ "margin-top": "15px" }}>
						Выберите микрофон:
						<br/>
						<Select
							onChange={handleSelectAudioDevice}
							disabled={loading()}
							value={audioDevices().find(audioDevice => (audioDevice.isActive === true && audioDevice.type === "audioinput"))?.id}
						>
							<SelectTrigger>
								<SelectValue />
								<SelectIcon />
							</SelectTrigger>
							<SelectContent>
								<SelectListbox>
									<For each={audioDevices().filter(audioDevice => audioDevice.type === "audioinput")}>
										{(audioDevice) => 
											<SelectOption value={audioDevice.id}>
												<SelectOptionText>{audioDevice.name} {audioDevice.isActive}</SelectOptionText>
											</SelectOption>
										}
									</For>
								</SelectListbox>
							</SelectContent>
						</Select>
					</Box>
					<Box css={{ "margin-top": "15px" }}>
						Выберите динамик:
						<br/>
						<Select
							onChange={handleSelectAudioDevice}
							disabled={loading()}
							value={audioDevices().find(audioDevice => (audioDevice.isActive === true && audioDevice.type === "audiooutput"))?.id}
						>
							<SelectTrigger>
								<SelectValue />
								<SelectIcon />
							</SelectTrigger>
							<SelectContent>
								<SelectListbox>
									<For each={audioDevices().filter(audioDevice => audioDevice.type === "audiooutput")}>
										{(audioDevice) => 
											<SelectOption value={audioDevice.id}>
												<SelectOptionText>{audioDevice.name} {audioDevice.isActive}</SelectOptionText>
											</SelectOption>
										}
									</For>
								</SelectListbox>
							</SelectContent>
						</Select>
					</Box>
				<br />
			</Box>
			<Button
				onClick={resetSettings}
				css={{ "margin-top": "12px" }}
				size="xs"
				colorScheme="danger"
				variant="dashed">
				Сбросить авторизацию
			</Button>
		</Box>
	);
}
