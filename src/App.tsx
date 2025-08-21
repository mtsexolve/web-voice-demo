import { Match, Switch } from "solid-js";
import { useStore } from "@nanostores/solid";
import { $settingsReady } from "./stores/settings.ts";
import { Setup } from "./components/Setup.tsx";

import { HopeProvider, NotificationsProvider, Box } from "@hope-ui/solid";
import { Dashboard } from "./components/Dashboard.tsx";

function App() {
	const ready = useStore($settingsReady);

	return (
		<HopeProvider config={{ initialColorMode: "system" }}>
			<NotificationsProvider>
					<Box
						textAlign={"center"}
						mt="25px"
					>
						<a 
							href="docs/index.html"
							target="_blank"
							rel="noreferrer noopener"
							style={{ 
								color: "blue",
								"text-decoration": "underline",
								"font-weight": 500
							}}
						>
							Открыть документацию Exolve Web Voice SDK
						</a>
					</Box>
					<Switch>
						<Match when={ready()}>
							<Dashboard />
						</Match>
						<Match when={!ready()}>
							<Setup />
						</Match>
					</Switch>
			</NotificationsProvider>
		</HopeProvider>
	);
}

export default App;
