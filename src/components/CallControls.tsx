import { 
    Box,
    Button,
    Input,
    notificationService,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "@hope-ui/solid";
import {
	CallItem,
	$calls,
} from "../stores/calls.ts";
import { createMemo, createSignal } from "solid-js";
import { formatPhoneNumber, formatSeconds } from "../utils/format.ts";
import { $attendedTransferCallID } from "../stores/attendedTransfer.ts";
import { CallDirection, CallState } from "@exolve/web-voice-sdk";
import { useStore } from "@nanostores/solid";



const directionTranslate = {
	[CallDirection.Incoming]: "Входящий",
	[CallDirection.Outgoing]: "Исходящий",
};

const callStateTranslate = {
	[CallState.Disconnected]: "Завершен",
	[CallState.Error]: "Звонок не удался",
	[CallState.New]: "Ждем ответа",
	[CallState.Connected]: "Идет разговор",
	[CallState.LostConnection]: "Потеряно соединение",
	[CallState.OnHold]: "На удержании",
};


// Типы для пропсов модального окна ввода номера для трансфера
interface BlindTransferNumberModalPromptProps {
  isOpen: () => boolean;
  title?: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}


// Компонент модального окна ввода номера для трансфера
const BlindTransferNumberModalPrompt = (props: BlindTransferNumberModalPromptProps) => {
  const [inputValue, setInputValue] = createSignal("");

  const handleSubmit = () => {
    props.onSubmit(inputValue());
    setInputValue(""); // Очистка поля после отправки
    props.onClose();
  };


  const handleCancel = () => {
    setInputValue(""); // Очистка поля при отмене
    props.onClose();
  };


  return (
    <Modal opened={props.isOpen()} onClose={handleCancel}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{props.title || "Введите номер телефона для трансфера"}</ModalHeader>
        <ModalBody>
          <Input
            placeholder={props.placeholder || "Номер телефона"}
            value={inputValue()}
            onInput={(e) => setInputValue(e.currentTarget.value)}
            autofocus
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={handleCancel}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>Перевести</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};



export function CallControls(props: { callItem: CallItem }) {
	const [blindTransferNumber, setBlindTransferNumber] = createSignal("");

	const titlePhone = createMemo(() =>props.callItem.call.number);

	const attendedTransferCallID = useStore($attendedTransferCallID);

	const calls = useStore($calls);

	const isIncoming = createMemo(() => props.callItem.call.direction === CallDirection.Incoming);
	const isProgressState = createMemo(() => props.callItem.state === CallState.New);
	const isConfirmedState = createMemo(
		() => (props.callItem.state === CallState.Connected
			|| props.callItem.state === CallState.OnHold
			|| props.callItem.state === CallState.LostConnection)
	);

	const [isBlindTransferNumberModalOpen, setIsBlindTransferNumberModalOpen] = createSignal(false);
	const openBlindTransferNumberModal = () => setIsBlindTransferNumberModalOpen(true);
	const closeBlindTransferNumberModal = () => setIsBlindTransferNumberModalOpen(false);


	const handleBlindTransferNumberModalSubmit = (number: string) => {
		console.log("Введенное значение номера трансфера:", number);
		setBlindTransferNumber(number);
		handleBlindTransfer();
	};


	const handleTerminate = () => {
		props.callItem.call.terminate();
	};

	const handleAccept = () => {
		props.callItem.call.accept();
	};

	const handleHoldToggle = async () => {
		if (props.callItem.call.state == CallState.OnHold) {
			console.log("Снятие вызова с удержания");
			props.callItem.call.resume();
		} else {
			console.log("Постановка вызова на удержание");
			props.callItem.call.hold();
		}
	};

	const handleBlindTransfer = async () => {
		console.log("1. handleBlindTransfer начат, номер:", blindTransferNumber());
		if (!blindTransferNumber()) {
			console.log("2. Ошибка: Пустой номер");
			notificationService.show({
				title: "Ошибка",
				status: "danger",
				description: "Введите номер для трансфера",
				duration: 3000,
			});
			return;
		}

		// Выполняем слепой трансфер напрямую (БЕЗ создания дополнительного звонка!)
		props.callItem.call.blindTransfer(blindTransferNumber()).then(()=> {
			console.log("16. Слепой трансфер выполнен успешно");
			notificationService.show({
				title: "Трансфер выполнен",
				status: "success",
				description: `Звонок переведен на номер ${blindTransferNumber()}`,
				duration: 5000,
			});
		}).catch((error: any) => {
			console.error("19. Ошибка при слепом трансфере:", error, error.stack);
			notificationService.show({
				title: "Ошибка при трансфере",
				status: "danger",
				description: error.message || "Не удалось выполнить перевод звонка",
				duration: 5000,
			});
		});
		$attendedTransferCallID.set(null);
	};


	const handleInitAttendedTransfer = async () => {
		console.log("Трансфер на линию инициирован");
		$attendedTransferCallID.set(props.callItem.call.id);
	};

	const handleDeinitAttendedTransfer = async () => {
		console.log("Трансфер на линию отменен");
		$attendedTransferCallID.set(null);
	};

	const handleAttendedTransfer = async () => {
		console.log("Выбрана линия для трансфера на линию");

		console.log("1. handleAttendedTransfer начат, номер:", attendedTransferCallID());

		const attendedTransferCallItem = calls().find((callItem) => callItem.call.id === attendedTransferCallID());
		$attendedTransferCallID.set(null);
		
		if (attendedTransferCallItem === undefined) {
			console.log("2. Ошибка: Не найдена линия в трансфере с сопровождением");
			notificationService.show({
				title: "Ошибка",
				status: "danger",
				description: "Не найдена линия в трансфере с сопровождением",
				duration: 3000,
			});
			return;
		}

		// Выполняем трансфер на линию
		attendedTransferCallItem.call.attendedTransfer(props.callItem.call).then(()=> {
			console.log("16. Трансфер на линию выполнен успешно");
			notificationService.show({
				title: "Трансфер на линию выполнен успешно ",
				status: "success",
				description: `Звонок переведен на номер ${props.callItem.call.number}`,
				duration: 5000,
			});
		}).catch((error: any) => {
			console.error("19. Ошибка при трансфере на линию:", error, error.stack);
			notificationService.show({
				title: "Ошибка при при трансфере на линию",
				status: "danger",
				description: error.message || "Не удалось выполнить перевод звонка",
				duration: 5000,
			});
		});	
	};
	
	return (
		<Box css={{ padding: "16px", borderRadius: "8px", backgroundColor: "$neutral2", display: "flex", gap: 2, flexDirection: "row", justifyContent: "space-between"}}>
			<Box css={{ display: "flex", flex: 2 ,gap: 12, alignItems: "right", flexDirection: "column", justifyContent: "space-between"}}>
				<Box css={{ fontWeight: "bolder" }}>{formatPhoneNumber(titlePhone())}</Box>
				<Box>{directionTranslate[props.callItem.call.direction]}</Box>
				<Box css={{ fontSize: "0.8em" }}>{callStateTranslate[props.callItem.state]}</Box>
				<Box css={{ fontSize: "0.8em" }}>Длительность: {formatSeconds(props.callItem.duration)}</Box>
			</Box>
			<Box css={{ display: "flex", flex: 1 ,gap: 12, alignItems: "center", flexDirection: "column" }}>
				{isIncoming() && isProgressState() && (
					<Button size="sm" onClick={handleAccept} colorScheme="success" variant="dashed">
						Принять звонок
					</Button>
				)}

				{isConfirmedState() && (
					<>
						<Box css={{ display: "flex", gap: 8, alignItems: "center" }}>
							<Button
								size="sm"
								onClick={handleHoldToggle}
								colorScheme={props.callItem.state == CallState.OnHold ? "primary" : "warning"}
								variant="dashed">
								{props.callItem.state == CallState.OnHold ? "Продолжить" : "Удержание"}
							</Button>
						</Box>

						<Box css={{ display: "flex", gap: 8, alignItems: "center" }}>
							<BlindTransferNumberModalPrompt
								isOpen={isBlindTransferNumberModalOpen}
								title="Введите номер телефона для трансфера"
								placeholder="Номер телефона"
								onSubmit={handleBlindTransferNumberModalSubmit}
								onClose={closeBlindTransferNumberModal}
							/>
							{attendedTransferCallID() === null && (
								<Button size="sm" onClick={openBlindTransferNumberModal} colorScheme="warning" variant="dashed">
									Трансфер на номер
								</Button>
							)}
						</Box>
						{calls().length > 1 && (
							<Box css={{ display: "flex", gap: 8, alignItems: "center" }}>
								{attendedTransferCallID() === null && (
									<Button size="sm" onClick={handleInitAttendedTransfer} colorScheme="warning" variant="dashed">
										Трансфер на линию
									</Button>
								)}
								{attendedTransferCallID() === props.callItem.call.id && (
									<Button size="sm" onClick={handleDeinitAttendedTransfer} colorScheme="warning" variant="dashed">
										Отменить
									</Button>
								)}
								{attendedTransferCallID() !== null &&
								 attendedTransferCallID() !== props.callItem.call.id &&
								 !( calls().find((callItem) => callItem.call.id === attendedTransferCallID())?.call.direction === CallDirection.Incoming  && props.callItem.call.direction === CallDirection.Incoming ) && (
									<Button size="sm" onClick={handleAttendedTransfer} colorScheme="warning" variant="dashed">
										Выбрать линию
									</Button>
								)}
							</Box>
						)}
					</>
				)}

				<Button onClick={handleTerminate} size="sm" colorScheme="danger" variant="dashed">
					Завершить звонок
				</Button>
			</Box>
		</Box>
	);
}
