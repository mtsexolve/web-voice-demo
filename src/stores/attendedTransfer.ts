import { atom } from "nanostores";
import { $calls } from "./calls.ts";

export const $attendedTransferCallID = atom<string | null>(null);

$calls.listen((calls) => {
    const attendedTransferCallID = $attendedTransferCallID.get();
    if( attendedTransferCallID !== null ) {
        const transferCall = calls.find(callItem => callItem.call.id === attendedTransferCallID);
        if(transferCall === undefined) {
            $attendedTransferCallID.set(null);
        }
    }
});



