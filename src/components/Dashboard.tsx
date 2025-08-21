import { Box } from "@hope-ui/solid";

import { BasedControls } from "./BasedControls.tsx";
import { CallControls } from "./CallControls.tsx";
import { useStore } from "@nanostores/solid";
import { $calls } from "../stores/calls.ts";
import { For } from "solid-js";
import { $communicator } from "../stores/communicator.ts";

export function Dashboard() {
	const calls = useStore($calls);
	const _ = useStore($communicator);

	console.log(_);

	return (
		<Box css={{ "padding-top": "64px" }}>
			<Box
				css={{
					width: 450,
					margin: "auto",
				}}>
				<BasedControls/>
				<For each={calls()}>{callItem => 
					<Box>
						<Box css={{ "height": "20px" }}/>
						<CallControls callItem={callItem} />
					</Box>
				}</For>
			</Box>
		</Box>
	);
}
